const FB_PAGE_URL = "https://www.facebook.com/profile.php?id=61587767691246";
const MESSENGER_URL = "https://m.me/61587767691246";

let PRODUCTS = [];
let currentSort = "default";
let currentQuery = "";

function formatPrice(p) {
  return p.toLocaleString("en-US") + " ج.م";
}

function orderLink(product) {
  const msg = encodeURIComponent(`مرحبًا، عايز أطلب: ${product.name} (${formatPrice(product.price)})`);
  return `${MESSENGER_URL}?text=${msg}`;
}

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
        <a class="order-btn" href="${orderLink(p)}" target="_blank" rel="noopener">اطلب الآن عبر مسنجر</a>
      </div>
    </div>
  `).join("");
}

async function init() {
  const res = await fetch("products.json");
  PRODUCTS = await res.json();
  render();

  document.getElementById("searchInput").addEventListener("input", (e) => {
    currentQuery = e.target.value;
    render();
  });

  document.getElementById("sortSelect").addEventListener("change", (e) => {
    currentSort = e.target.value;
    render();
  });
}

init();
