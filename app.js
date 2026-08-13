const WHATSAPP_NUMBER = "201284622564";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const CART_KEY = "amira_art_corner_cart";

let PRODUCTS = [];
let currentSort = "default";
let currentQuery = "";

function formatPrice(p) {
  return p.toLocaleString("en-US") + " ج.م";
}

function whatsappLink(product) {
  const msg = encodeURIComponent(`مرحبًا، عايز أطلب: ${product.name} (${formatPrice(product.price)})`);
  return `${WHATSAPP_URL}?text=${msg}`;
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
  document.getElementById("cartBadge").textContent = cartCount();
}

function renderCartDrawer() {
  const cart = getCart();
  const container = document.getElementById("cartItems");
  const ids = Object.keys(cart);

  if (ids.length === 0) {
    container.innerHTML = `<div class="cart-empty">السلة فاضية دلوقتي — اختاري أي لوحة وضيفيها 🎨</div>`;
  } else {
    container.innerHTML = ids.map(id => {
      const product = PRODUCTS.find(p => String(p.id) === String(id));
      if (!product) return "";
      const qty = cart[id];
      return `
        <div class="cart-item">
          <img src="${product.image}" alt="${product.name}" />
          <div class="cart-item-info">
            <div class="cart-item-name">${product.name}</div>
            <div class="cart-item-price">${formatPrice(product.price)}</div>
            <div class="cart-item-qty">
              <button data-action="dec" data-id="${id}" type="button">−</button>
              <span>${qty}</span>
              <button data-action="inc" data-id="${id}" type="button">+</button>
              <button class="cart-item-remove" data-action="remove" data-id="${id}" type="button">حذف</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  document.getElementById("cartTotal").textContent = formatPrice(cartTotal());
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
  const lines = ["مرحبًا، عايزة أطلب القطع دي:"];
  let total = 0;
  for (const id in cart) {
    const product = PRODUCTS.find(p => String(p.id) === String(id));
    if (!product) continue;
    const qty = cart[id];
    const lineTotal = product.price * qty;
    total += lineTotal;
    lines.push(`- ${product.name} × ${qty} = ${formatPrice(lineTotal)}`);
  }
  lines.push(`الإجمالي: ${formatPrice(total)}`);
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

/* ---------------- Product grid ---------------- */

function render() {
  const grid = document.getElementById("grid");
  const countLabel = document.getElementById("countLabel");

  let items = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(currentQuery.toLowerCase()) ||
    String(p.id).includes(currentQuery)
  );

  if (currentSort === "price-asc") items.sort((a, b) => a.price - b.price);
  if (currentSort === "price-desc") items.sort((a, b) => b.price - a.price);
  if (currentSort === "default") items.sort((a, b) => a.id - b.id);

  countLabel.textContent = `${items.length} منتج`;

  if (items.length === 0) {
    grid.innerHTML = `<div class="empty-state">مفيش منتجات مطابقة للبحث</div>`;
    return;
  }

  grid.innerHTML = items.map(p => `
    <div class="card">
      <div class="thumb">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="pname">${p.name}</div>
        <div class="pprice">${formatPrice(p.price)}</div>
        <button class="add-cart-btn" data-add-id="${p.id}" type="button">أضف للسلة 🛒</button>
        <a class="order-btn" href="${whatsappLink(p)}" target="_blank" rel="noopener">اطلب مباشرة عبر واتساب</a>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll("button[data-add-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.addId);
      btn.textContent = "✓ اتضافت للسلة";
      btn.classList.add("added");
      setTimeout(() => {
        btn.textContent = "أضف للسلة 🛒";
        btn.classList.remove("added");
      }, 1200);
      openCart();
    });
  });
}

async function init() {
  const res = await fetch("products.json");
  PRODUCTS = await res.json();
  render();
  renderCartBadge();
  renderCartDrawer();

  document.getElementById("searchInput").addEventListener("input", (e) => {
    currentQuery = e.target.value;
    render();
  });

  document.getElementById("sortSelect").addEventListener("change", (e) => {
    currentSort = e.target.value;
    render();
  });

  document.getElementById("cartOpenBtn").addEventListener("click", openCart);
  document.getElementById("cartCloseBtn").addEventListener("click", closeCart);
  document.getElementById("cartOverlay").addEventListener("click", closeCart);

  document.getElementById("cartCheckoutBtn").addEventListener("click", () => {
    const msg = encodeURIComponent(buildCheckoutMessage());
    window.open(`${WHATSAPP_URL}?text=${msg}`, "_blank", "noopener");
  });
}

init();
