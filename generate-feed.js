const fs = require('fs');
const products = JSON.parse(fs.readFileSync('products.json', 'utf-8'));
const BASE = 'https://art-corner.org';

function csvEscape(v) {
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const header = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand'];
const rows = [header.join(',')];

for (const p of products) {
  const row = [
    p.id,
    `Art Corner - ${p.name}`,
    `قطعة فنية أصلية مرسومة يدويًا من Art Corner`,
    p.soldOut ? 'out of stock' : 'in stock',
    'new',
    `${p.price.toFixed(2)} EGP`,
    `${BASE}/index.html?p=${p.id}`,
    `${BASE}/${p.image}`,
    'Art Corner',
  ].map(csvEscape);
  rows.push(row.join(','));
}

fs.writeFileSync('products-feed.csv', rows.join('\n') + '\n', 'utf-8');
console.log('Generated products-feed.csv with', products.length, 'rows');
