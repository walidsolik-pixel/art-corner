const WHATSAPP_NUMBER = "201284622564";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const CART_KEY = "amira_art_corner_cart";
const DISCOUNT_MARKUP = 1.3; // "before discount" price = sale price * 1.3

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
  return t().productName(p.id);
}

function originalPrice(price) {
  return Math.round(price * DISCOUNT_MARKUP);
}

function discountPercent(price) {
  const orig = originalPrice(price);
  return Math.round((1 - price / orig) * 100);
}

function whatsappLink(product) {
  const lang = getLang();
  const msg = encodeURIComponent(t().orderMsg(productName(product), formatPrice(product.price, lang)));
  return `${WHATSAPP_URL}?text=${msg}`;
}

/* ---------------- Meta Pixel events ---------------- */

function trackPixel(event, params) {
  if (typeof fbq === "function") fbq("track", event, params);
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

function cartTotal() {
  const cart = getCart();
  let total = 0;
  for (const id in cart) {
    const product = PRODUCTS.find(p => String(p.id) === String(id));
    if (product) total += product.price * cart[id];
  }
  return total;
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

  if (ids.length === 0) {
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

  document.getElementById("cartTotal").textContent = formatPrice(cartTotal(), lang);
  const checkoutBtn = document.getElementById("cartCheckoutBtn");
  checkoutBtn.disabled = ids.length === 0;

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

function buildCheckoutMessage() {
  const cart = getCart();
  const lang = getLang();
  const T = t();
  const lines = [T.checkoutIntro];
  let total = 0;
  for (const id in cart) {
    const product = PRODUCTS.find(p => String(p.id) === String(id));
    if (!product) continue;
    const qty = cart[id];
    const lineTotal = product.price * qty;
    total += lineTotal;
    lines.push(`- ${productName(product)} × ${qty} = ${formatPrice(lineTotal, lang)}`);
  }
  lines.push(`${T.checkoutTotal}: ${formatPrice(total, lang)}`);
  return lines.join("\n");
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

  grid.innerHTML = items.map(p => {
    const orig = originalPrice(p.price);
    const pct = discountPercent(p.price);
    return `
    <div class="card">
      <div class="thumb">
        <img src="${p.image}" alt="${productName(p)}" loading="lazy" />
        <span class="discount-badge">-${pct}%</span>
      </div>
      <div class="card-body">
        <div class="pname">${productName(p)}</div>
        <div class="price-row">
          <span class="price-original">${formatPrice(orig, lang)}</span>
          <span class="price-sale">${formatPrice(p.price, lang)}</span>
        </div>
        <button class="add-cart-btn" data-add-id="${p.id}" type="button">${T.addToCart}</button>
        <a class="order-btn" data-order-id="${p.id}" href="${whatsappLink(p)}" target="_blank" rel="noopener">${T.orderNow}</a>
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

  grid.querySelectorAll("a[data-order-id]").forEach(link => {
    link.addEventListener("click", () => {
      const product = PRODUCTS.find(p => String(p.id) === link.dataset.orderId);
      if (product) {
        trackPixel("InitiateCheckout", {
          content_ids: [String(product.id)],
          content_type: "product",
          content_name: productName(product),
          value: product.price,
          currency: "EGP",
          num_items: 1,
        });
      }
    });
  });
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
    }
  } else {
    trackPixel("ViewContent", {
      content_ids: PRODUCTS.map(p => String(p.id)),
      content_type: "product_group",
      currency: "EGP",
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
    trackPixel("InitiateCheckout", {
      content_ids: ids,
      content_type: "product",
      value: cartTotal(),
      currency: "EGP",
      num_items: cartCount(),
    });
    const msg = encodeURIComponent(buildCheckoutMessage());
    window.open(`${WHATSAPP_URL}?text=${msg}`, "_blank", "noopener");
  });
}

init();
