/**
 * Art Corner — order backend (Google Apps Script Web App)
 *
 * Receives a checkout POST from art-corner.org, validates it, recomputes the
 * shipping fee server-side (never trusts the client's number), logs the
 * order to a Google Sheet, alerts the seller on WhatsApp (via CallMeBot),
 * and reports a server-side Purchase event to Meta Conversions API.
 *
 * ONE-TIME SETUP (see the chat instructions for the full walkthrough):
 *   1. Deploy this as a Web App (Execute as: Me, Who has access: Anyone).
 *   2. Script Properties (Project Settings → Script Properties):
 *      - CALLMEBOT_APIKEY  → from callmebot.com WhatsApp activation
 *      - META_CAPI_TOKEN   → from Meta Events Manager → Conversions API
 *   3. First request auto-creates the "Art Corner Orders" spreadsheet with
 *      an Orders tab and a Shipping tab (default rates per governorate) —
 *      edit the Shipping tab any time, no redeploy needed.
 */

const CALLMEBOT_PHONE = "201284622564";
const META_PIXEL_ID = "1698406408088102";
const DEFAULT_SHIPPING_FEE = 70;
const SPREADSHEET_NAME = "Art Corner Orders";

const DEFAULT_SHIPPING_RATES = {
  "القاهرة": 50, "الجيزة": 50, "القليوبية": 55,
  "الإسكندرية": 65, "البحيرة": 70, "الغربية": 65, "المنوفية": 60,
  "الدقهلية": 65, "كفر الشيخ": 70, "دمياط": 70, "الشرقية": 65,
  "بورسعيد": 70, "الإسماعيلية": 70, "السويس": 70,
  "شمال سيناء": 100, "جنوب سيناء": 100,
  "بني سويف": 65, "الفيوم": 65, "المنيا": 75, "أسيوط": 80,
  "سوهاج": 85, "قنا": 90, "الأقصر": 95, "أسوان": 100,
  "البحر الأحمر": 100, "مطروح": 100, "الوادي الجديد": 110,
};

/* ---------------- HTTP entry points ---------------- */

function doGet(e) {
  if (e.parameter.action === "shipping") {
    return jsonResponse({ shipping: getAllShipping(getOrCreateSpreadsheet()) });
  }
  if (e.parameter.action === "presence") {
    // NOTE: the query param is named "vid" (visitor id), deliberately NOT
    // "sid"/"session" — Google's front end silently breaks the exec
    // redirect for those two param names (confirmed by testing), so this
    // naming isn't cosmetic.
    return jsonResponse({ online: trackPresence(e.parameter.vid) });
  }
  return jsonResponse({ ok: true, service: "art-corner-orders" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    const error = validateOrder(body);
    if (error) return jsonResponse({ success: false, error: error });

    const ss = getOrCreateSpreadsheet();
    const shipping = getShippingFee(ss, body.governorate);
    const items = body.items;
    const subtotal = items.reduce((s, it) => s + Number(it.price) * Number(it.qty), 0);
    const total = subtotal + shipping;
    const orderId = "AC-" + Utilities.formatDate(new Date(), "Africa/Cairo", "yyMMdd-HHmmss");

    appendOrder(ss, {
      orderId: orderId, name: body.name, phone: body.phone, governorate: body.governorate,
      address: body.address, notes: body.notes || "", items: items,
      subtotal: subtotal, shipping: shipping, total: total,
    });

    sendWhatsAppAlert(orderId, body, items, subtotal, shipping, total);
    sendMetaPurchase(orderId, body, total, items);

    return jsonResponse({ success: true, orderId: orderId, shipping: shipping, subtotal: subtotal, total: total });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function validateOrder(body) {
  if (!body) return "missing body";
  if (!body.name || String(body.name).trim().length < 2) return "الاسم مطلوب";
  if (!body.phone || !/^01[0-9]{9}$/.test(String(body.phone).trim())) return "رقم موبايل مصري غير صحيح";
  if (!body.governorate) return "المحافظة مطلوبة";
  if (!body.address || String(body.address).trim().length < 5) return "العنوان مطلوب";
  if (!Array.isArray(body.items) || body.items.length === 0) return "السلة فارغة";
  return null;
}

/* ---------------- Spreadsheet ---------------- */

function getOrCreateSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty("SPREADSHEET_ID");
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* fall through and recreate */ }
  }
  const ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  props.setProperty("SPREADSHEET_ID", ss.getId());

  const orders = ss.getSheets()[0];
  orders.setName("Orders");
  orders.appendRow([
    "التاريخ", "رقم الأوردر", "الاسم", "الموبايل", "المحافظة", "العنوان",
    "ملاحظات", "المنتجات", "الإجمالي قبل الشحن", "الشحن", "الإجمالي الكلي", "طريقة الدفع",
  ]);
  orders.setFrozenRows(1);

  const shipping = ss.insertSheet("Shipping");
  shipping.appendRow(["المحافظة", "سعر الشحن (ج.م)"]);
  shipping.setFrozenRows(1);
  Object.keys(DEFAULT_SHIPPING_RATES).forEach(function (gov) {
    shipping.appendRow([gov, DEFAULT_SHIPPING_RATES[gov]]);
  });

  return ss;
}

function getAllShipping(ss) {
  const sheet = ss.getSheetByName("Shipping");
  const rows = sheet.getDataRange().getValues().slice(1); // skip header
  const result = {};
  rows.forEach(function (row) {
    if (row[0]) result[String(row[0]).trim()] = Number(row[1]) || DEFAULT_SHIPPING_FEE;
  });
  return result;
}

function getShippingFee(ss, governorate) {
  const all = getAllShipping(ss);
  return all[String(governorate).trim()] || DEFAULT_SHIPPING_FEE;
}

function appendOrder(ss, o) {
  const sheet = ss.getSheetByName("Orders");
  const itemsSummary = o.items
    .map(function (it) { return it.name + " ×" + it.qty + " (" + it.price + " ج.م)"; })
    .join(" | ");
  sheet.appendRow([
    new Date(), o.orderId, o.name, o.phone, o.governorate, o.address,
    o.notes, itemsSummary, o.subtotal, o.shipping, o.total, "الدفع عند الاستلام",
  ]);
}

/* ---------------- WhatsApp alert (CallMeBot) ---------------- */

function sendWhatsAppAlert(orderId, body, items, subtotal, shipping, total) {
  const apikey = PropertiesService.getScriptProperties().getProperty("CALLMEBOT_APIKEY");
  if (!apikey) { Logger.log("CALLMEBOT_APIKEY not set — skipping WhatsApp alert"); return; }

  const lines = items.map(function (it) {
    return "- " + it.name + " × " + it.qty + " = " + (it.price * it.qty) + " ج.م";
  });
  const msg = [
    "🛍️ أوردر جديد " + orderId,
    "الاسم: " + body.name,
    "الموبايل: " + body.phone,
    "المحافظة: " + body.governorate,
    "العنوان: " + body.address,
    body.notes ? "ملاحظات: " + body.notes : null,
    lines.join("\n"),
    "شحن: " + shipping + " ج.م",
    "الإجمالي: " + total + " ج.م (دفع عند الاستلام)",
  ].filter(function (l) { return l; }).join("\n");

  const url = "https://api.callmebot.com/whatsapp.php?phone=" + CALLMEBOT_PHONE
    + "&text=" + encodeURIComponent(msg) + "&apikey=" + apikey;
  try {
    UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  } catch (e) {
    Logger.log("CallMeBot send failed: " + e);
  }
}

/* ---------------- Meta Conversions API (server-side Purchase) ---------------- */

function sendMetaPurchase(orderId, body, total, items) {
  const token = PropertiesService.getScriptProperties().getProperty("META_CAPI_TOKEN");
  if (!token) { Logger.log("META_CAPI_TOKEN not set — skipping Conversions API"); return; }

  const phoneDigits = String(body.phone).replace(/\D/g, "");
  const e164Phone = phoneDigits.replace(/^0/, "20"); // Egyptian local -> country-code form, e.g. 01xxxxxxxxx -> 201xxxxxxxxx

  const payload = {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      // The client generates this same id and passes it to fbq('track', 'Purchase', params, {eventID})
      // — Meta de-duplicates the browser Pixel event and this server-side CAPI event when the ids match.
      event_id: body.event_id || orderId,
      action_source: "website",
      event_source_url: "https://art-corner.org/",
      user_data: {
        ph: [sha256Hex(e164Phone)],
      },
      custom_data: {
        currency: "EGP",
        value: total,
        content_ids: items.map(function (it) { return String(it.id); }),
        content_type: "product",
        num_items: items.reduce(function (s, it) { return s + Number(it.qty); }, 0),
      },
    }],
  };

  const url = "https://graph.facebook.com/v19.0/" + META_PIXEL_ID + "/events?access_token=" + token;
  try {
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
  } catch (e) {
    Logger.log("Meta CAPI send failed: " + e);
  }
}

function sha256Hex(input) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input.trim().toLowerCase());
  return bytes.map(function (b) {
    return ("0" + (b & 0xff).toString(16)).slice(-2);
  }).join("");
}

/* ---------------- Live visitor presence ----------------
   A cheap "N people browsing now" counter. Deliberately NOT backed by the
   Sheet — it uses CacheService (in-memory, fast) so it costs nothing extra
   in quota or latency no matter how often visitors heartbeat. Approximate
   by design (no lock): a lost race just self-corrects on the next
   heartbeat ~25s later, which is fine for a vanity counter. */

const PRESENCE_CACHE_KEY = "online_visitors";
const PRESENCE_TTL_SECONDS = 90; // drop a visitor from the count after this long without a heartbeat
const PRESENCE_CACHE_EXPIRY_SECONDS = 21600; // 6h, CacheService's own max — TTL above is what actually prunes

function trackPresence(sessionId) {
  const id = sessionId || ("anon-" + Math.random());
  const cache = CacheService.getScriptCache();
  const raw = cache.get(PRESENCE_CACHE_KEY);
  const now = Date.now();
  const map = raw ? JSON.parse(raw) : {};
  map[id] = now;
  Object.keys(map).forEach(function (k) {
    if (now - map[k] > PRESENCE_TTL_SECONDS * 1000) delete map[k];
  });
  cache.put(PRESENCE_CACHE_KEY, JSON.stringify(map), PRESENCE_CACHE_EXPIRY_SECONDS);
  return Object.keys(map).length;
}

/* ---------------- Helpers ---------------- */

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
