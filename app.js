const WHATSAPP_NUMBER = "201284622564";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const CART_KEY = "amira_art_corner_cart";
const DISCOUNT_MARKUP = 1.3; // "before discount" price = sale price * 1.3

// Google Apps Script Web App — still used for the live "N browsing now"
// presence badge (see startPresenceHeartbeat below). Checkout itself goes
// through WhatsApp again, not this backend.
const ORDERS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxdWFWzjk6ntqRpmqqUUjR-X5-P8EiAGqBNXyXmrGvnGoKgwBv_isyOakd60aO2tLg/exec";

let PRODUCTS = [];
let currentSort = "default";
let currentQuery = "";
let pinnedProductId = null;

function formatPrice(p, lang) {
  const locale = lang === "en" ? "en-US" : "en-US";
  const suffix = lang === "en" ? " EGP" : " ج.م";
  return Math.round(p).toLocaleString(locale) + suffix;
}

function productName(p) {
  const lang = getLang();
  if (lang === "en" && p.nameEn) return p.nameEn;
  if (lang === "ar" && p.name) return p.name;
  return t().productName(p.id);
}

function originalPrice(product) {
  if (product && typeof product.originalPrice === "number") return product.originalPrice;
  const price = typeof product === "number" ? product : product.price;
  return Math.round(price * DISCOUNT_MARKUP);
}

function discountPercent(product) {
  const price = typeof product === "number" ? product : product.price;
  const orig = originalPrice(product);
  return Math.round((1 - price / orig) * 100);
}

function webpSrc(image) {
  return image.replace(/\.jpe?g$/i, ".webp");
}

function whatsappLink(product) {
  const lang = getLang();
  const msg = encodeURIComponent(t().orderMsg(productName(product), formatPrice(product.price, lang)));
  return `${WHATSAPP_URL}?text=${msg}`;
}

function buildCheckoutMessage() {
  const lang = getLang();
  const T = t();
  const items = cartItemsList();
  const lines = [T.checkoutIntro];
  let total = 0;
  items.forEach(it => {
    const lineTotal = it.price * it.qty;
    total += lineTotal;
    lines.push(`- ${it.name} × ${it.qty} = ${formatPrice(lineTotal, lang)}`);
  });
  lines.push(`${T.checkoutTotal}: ${formatPrice(total, lang)}`);
  return lines.join("\n");
}

/* ---------------- Meta Pixel events ---------------- */

// eventId is optional — pass it for Purchase so the server-side Conversions
// API call (Code.gs) can report the exact same event and Meta de-duplicates
// the two instead of double-counting.
function trackPixel(event, params, eventId) {
  if (typeof fbq !== "function") return;
  if (eventId) fbq("track", event, params, { eventID: eventId });
  else fbq("track", event, params);
}

/* ---------------- GA4 events (mirrors the Pixel events above so we get a
   funnel + per-product interest breakdown in Google Analytics too) ------ */

function trackGA(event, params) {
  if (typeof gtag === "function") gtag("event", event, params);
}

function gaItem(product, qty) {
  return {
    item_id: String(product.id),
    item_name: productName(product),
    price: product.price,
    quantity: qty || 1,
  };
}

/* ---------------- Cart storage ---------------- */

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(productId) {
  const cart = getCart();
  cart[productId] = (cart[productId] || 0) + 1;
  saveCart(cart);
  renderCartBadge();
  renderCartDrawer();

  const product = PRODUCTS.find(p => String(p.id) === String(productId));
  if (product) {
    trackPixel("AddToCart", {
      content_ids: [String(product.id)],
      content_type: "product",
      content_name: productName(product),
      value: product.price,
      currency: "EGP",
    });
    trackGA("add_to_cart", {
      currency: "EGP",
      value: product.price,
      items: [gaItem(product)],
    });
  }
}

function changeQty(productId, delta) {
  const cart = getCart();
  if (!cart[productId]) return;
  cart[productId] += delta;
  if (cart[productId] <= 0) delete cart[productId];
  saveCart(cart);
  renderCartBadge();
  renderCartDrawer();
}

function removeFromCart(productId) {
  const cart = getCart();
  delete cart[productId];
  saveCart(cart);
  renderCartBadge();
  renderCartDrawer();
}

function cartCount() {
  const cart = getCart();
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function cartSubtotal() {
  const cart = getCart();
  let total = 0;
  for (const id in cart) {
    const product = PRODUCTS.find(p => String(p.id) === String(id));
    if (product) total += product.price * cart[id];
  }
  return total;
}

function cartItemsList() {
  const cart = getCart();
  return Object.keys(cart)
    .map(id => {
      const product = PRODUCTS.find(p => String(p.id) === String(id));
      return product ? { id: product.id, name: productName(product), qty: cart[id], price: product.price } : null;
    })
    .filter(Boolean);
}

function renderCartBadge() {
  const el = document.getElementById("cartBadge");
  if (el) el.textContent = cartCount();
}

function renderCartDrawer() {
  const cart = getCart();
  const container = document.getElementById("cartItems");
  if (!container) return;
  const ids = Object.keys(cart);
  const lang = getLang();
  const T = t();
  const isEmpty = ids.length === 0;

  if (isEmpty) {
    container.innerHTML = `<div class="cart-empty">${T.cartEmpty}</div>`;
  } else {
    container.innerHTML = ids.map(id => {
      const product = PRODUCTS.find(p => String(p.id) === String(id));
      if (!product) return "";
      const qty = cart[id];
      return `
        <div class="cart-item">
          <img src="${product.image}" alt="${productName(product)}" />
          <div class="cart-item-info">
            <div class="cart-item-name">${productName(product)}</div>
            <div class="cart-item-price">${formatPrice(product.price, lang)}</div>
            <div class="cart-item-qty">
              <button data-action="dec" data-id="${id}" type="button">−</button>
              <span>${qty}</span>
              <button data-action="inc" data-id="${id}" type="button">+</button>
              <button class="cart-item-remove" data-action="remove" data-id="${id}" type="button">${T.remove}</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  document.getElementById("cartTotal").textContent = formatPrice(cartSubtotal(), lang);
  const checkoutBtn = document.getElementById("cartCheckoutBtn");
  if (checkoutBtn) checkoutBtn.disabled = isEmpty;

  container.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === "inc") changeQty(id, 1);
      if (action === "dec") changeQty(id, -1);
      if (action === "remove") removeFromCart(id);
    });
  });
}

/* ---------------- Product image lightbox (click-to-zoom) ----------------
   Reuses the already-loaded <img> element (currentSrc, whichever the
   <picture> already picked and downloaded — webp or jpeg fallback) so
   opening the zoom costs zero extra network requests and can't slow the
   site down, no matter how many products/images the catalog grows to. */

function openLightbox(product, imgEl) {
  const overlay = document.getElementById("lightboxOverlay");
  const img = document.getElementById("lightboxImg");
  if (!overlay || !img) return;
  img.src = imgEl.currentSrc || imgEl.src;
  img.alt = imgEl.alt;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";

  trackGA("view_item", {
    currency: "EGP",
    value: product.price,
    items: [gaItem(product)],
  });
}

function closeLightbox() {
  const overlay = document.getElementById("lightboxOverlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

/* ---------------- Live visitor presence badge ----------------
   One tiny GET every ~25s to the same order backend — no new server, no
   library, and it's deferred to run-when-idle so it never competes with
   the page's own render. If it ever fails, it just fails silently and
   the badge stays hidden; it never blocks or slows anything else. */

const PRESENCE_SESSION_KEY = "amira_art_corner_sid";
const PRESENCE_INTERVAL_MS = 10000;

function getSessionId() {
  let sid = sessionStorage.getItem(PRESENCE_SESSION_KEY);
  if (!sid) {
    sid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    sessionStorage.setItem(PRESENCE_SESSION_KEY, sid);
  }
  return sid;
}

async function sendPresenceHeartbeat() {
  try {
    // "vid", not "sid"/"session" — those two names break the Apps Script
    // exec redirect on Google's end (confirmed by testing).
    const res = await fetch(`${ORDERS_WEBAPP_URL}?action=presence&vid=${encodeURIComponent(getSessionId())}`);
    const data = await res.json();
    if (typeof data.online !== "number") return;
    const badge = document.getElementById("liveBadge");
    const countEl = document.getElementById("liveCount");
    if (badge && countEl) {
      countEl.textContent = data.online;
      badge.hidden = false;
    }
  } catch (e) {
    // Nice-to-have only — never worth surfacing an error for.
  }
}

function startPresenceHeartbeat() {
  sendPresenceHeartbeat();
  setInterval(sendPresenceHeartbeat, PRESENCE_INTERVAL_MS);
}

function openCart() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartOverlay").classList.add("open");
}

function closeCart() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("open");
}

/* ---------------- Static text ---------------- */

function applyStaticText() {
  const T = t();
  applyDocumentLang();

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (T[key] !== undefined) el.textContent = T[key];
  });
  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    const key = el.dataset.i18nHtml;
    if (T[key] !== undefined) el.innerHTML = T[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (T[key] !== undefined) el.placeholder = T[key];
  });

  const langBtn = document.getElementById("langToggleBtn");
  if (langBtn) langBtn.textContent = T.langToggle;

  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.options[0].textContent = T.sortDefault;
    sortSelect.options[1].textContent = T.sortPriceAsc;
    sortSelect.options[2].textContent = T.sortPriceDesc;
  }
}

function toggleLang() {
  setLang(getLang() === "ar" ? "en" : "ar");
  applyStaticText();
  render();
  renderCartDrawer();
}

/* ---------------- Product grid ---------------- */

function render() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  const countLabel = document.getElementById("countLabel");
  const T = t();
  const lang = getLang();

  let items;
  if (pinnedProductId) {
    items = PRODUCTS.filter(p => String(p.id) === String(pinnedProductId));
  } else {
    items = PRODUCTS.filter(p =>
      productName(p).toLowerCase().includes(currentQuery.toLowerCase()) ||
      String(p.id).includes(currentQuery)
    );
  }

  if (currentSort === "price-asc") items.sort((a, b) => a.price - b.price);
  if (currentSort === "price-desc") items.sort((a, b) => b.price - a.price);
  if (currentSort === "default") items.sort((a, b) => a.id - b.id);

  countLabel.textContent = `${items.length} ${T.countSuffix}`;

  if (items.length === 0) {
    grid.innerHTML = `<div class="empty-state">${T.emptySearch}</div>`;
    return;
  }

  grid.innerHTML = items.map((p, idx) => {
    const orig = originalPrice(p);
    const pct = discountPercent(p);
    // The first card in the grid is the LCP candidate: load it eagerly with
    // high priority instead of lazily, so the browser discovers and fetches
    // it immediately rather than waiting to notice it after layout.
    const imgAttrs = idx === 0 ? `fetchpriority="high"` : `loading="lazy"`;

    if (p.soldOut) {
      return `
      <div class="card sold-out">
        <div class="thumb" data-zoom-id="${p.id}">
          <picture>
            <source srcset="${webpSrc(p.image)}" type="image/webp" />
            <img src="${p.image}" alt="${productName(p)}" ${imgAttrs} width="600" height="600" />
          </picture>
          <span class="discount-badge sold-out-badge">${T.soldOut}</span>
        </div>
        <div class="card-body">
          <div class="pname">${productName(p)}</div>
          <div class="price-row">
            <span class="price-original">${formatPrice(orig, lang)}</span>
            <span class="price-sale">${formatPrice(p.price, lang)}</span>
          </div>
          <button class="add-cart-btn" type="button" disabled>${T.soldOut}</button>
        </div>
      </div>
    `;
    }

    return `
    <div class="card">
      <div class="thumb" data-zoom-id="${p.id}">
        <picture>
          <source srcset="${webpSrc(p.image)}" type="image/webp" />
          <img src="${p.image}" alt="${productName(p)}" ${imgAttrs} width="600" height="600" />
        </picture>
        <span class="discount-badge">-${pct}%</span>
      </div>
      <div class="card-body">
        <div class="pname">${productName(p)}</div>
        <div class="price-row">
          <span class="price-original">${formatPrice(orig, lang)}</span>
          <span class="price-sale">${formatPrice(p.price, lang)}</span>
        </div>
        <button class="add-cart-btn" data-add-id="${p.id}" type="button">${T.addToCart}</button>
        <button class="order-btn" data-order-id="${p.id}" type="button">${T.orderNow}</button>
      </div>
    </div>
  `;
  }).join("");

  grid.querySelectorAll("button[data-add-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.addId);
      const original = t().addToCart;
      btn.textContent = t().addedToCart;
      btn.classList.add("added");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("added");
      }, 1200);
      openCart();
    });
  });

  grid.querySelectorAll("button[data-order-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const product = PRODUCTS.find(p => String(p.id) === btn.dataset.orderId);
      if (!product) return;
      trackPixel("InitiateCheckout", {
        content_ids: [String(product.id)],
        content_type: "product",
        content_name: productName(product),
        value: product.price,
        currency: "EGP",
        num_items: 1,
      });
      trackGA("begin_checkout", {
        currency: "EGP",
        value: product.price,
        items: [gaItem(product)],
      });
      window.open(whatsappLink(product), "_blank", "noopener");
    });
  });

  grid.querySelectorAll(".thumb[data-zoom-id]").forEach(thumb => {
    thumb.addEventListener("click", () => {
      const product = PRODUCTS.find(p => String(p.id) === thumb.dataset.zoomId);
      const imgEl = thumb.querySelector("img");
      if (product && imgEl) openLightbox(product, imgEl);
    });
  });
}

function injectProductSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": PRODUCTS.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": productName(p),
        "image": `https://art-corner.org/${p.image}`,
        "url": `https://art-corner.org/index.html?p=${p.id}`,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "EGP",
          "price": p.price,
          "availability": p.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        },
      },
    })),
  };
  let script = document.getElementById("product-ld");
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "product-ld";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

async function init() {
  applyStaticText();

  const res = await fetch("products.json");
  PRODUCTS = await res.json();

  const params = new URLSearchParams(window.location.search);
  const productParam = params.get("p");
  if (productParam) {
    pinnedProductId = productParam;
    const si = document.getElementById("searchInput");
    if (si) si.value = productParam;
  }

  render();
  renderCartBadge();
  renderCartDrawer();

  // Structured data is only for crawlers, not for the visible page, so build
  // it once the browser is idle instead of competing with the initial render.
  if ("requestIdleCallback" in window) {
    requestIdleCallback(injectProductSchema);
    requestIdleCallback(startPresenceHeartbeat);
  } else {
    setTimeout(injectProductSchema, 200);
    setTimeout(startPresenceHeartbeat, 300);
  }

  if (productParam) {
    document.getElementById("grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const product = PRODUCTS.find(p => String(p.id) === String(productParam));
    if (product) {
      trackPixel("ViewContent", {
        content_ids: [String(product.id)],
        content_type: "product",
        content_name: productName(product),
        value: product.price,
        currency: "EGP",
      });
      trackGA("view_item", {
        currency: "EGP",
        value: product.price,
        items: [gaItem(product)],
      });
    }
  } else {
    trackPixel("ViewContent", {
      content_ids: PRODUCTS.map(p => String(p.id)),
      content_type: "product_group",
      currency: "EGP",
    });
    trackGA("view_item_list", {
      items: PRODUCTS.map(p => gaItem(p)),
    });
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      pinnedProductId = null;
      currentQuery = e.target.value;
      render();
    });
  }

  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      render();
    });
  }

  document.getElementById("cartOpenBtn")?.addEventListener("click", openCart);
  document.getElementById("cartCloseBtn")?.addEventListener("click", closeCart);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
  document.getElementById("langToggleBtn")?.addEventListener("click", toggleLang);

  document.getElementById("cartCheckoutBtn")?.addEventListener("click", () => {
    const cart = getCart();
    const ids = Object.keys(cart);
    if (ids.length === 0) return;
    trackPixel("InitiateCheckout", {
      content_ids: ids,
      content_type: "product",
      value: cartSubtotal(),
      currency: "EGP",
      num_items: cartCount(),
    });
    trackGA("begin_checkout", {
      currency: "EGP",
      value: cartSubtotal(),
      items: cartItemsList().map(it => gaItem(PRODUCTS.find(p => String(p.id) === String(it.id)), it.qty)),
    });
    const msg = encodeURIComponent(buildCheckoutMessage());
    window.open(`${WHATSAPP_URL}?text=${msg}`, "_blank", "noopener");
  });

  document.getElementById("lightboxCloseBtn")?.addEventListener("click", closeLightbox);
  document.getElementById("lightboxOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "lightboxOverlay") closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
}

init();
