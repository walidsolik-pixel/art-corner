const LANG_KEY = "amira_lang";

const TRANSLATIONS = {
  ar: {
    dir: "rtl",
    brand: "Amira Art Corner",
    navShop: "المتجر",
    navAbout: "من نحن",
    navContact: "تواصل معنا",
    fbLink: "صفحتنا على فيسبوك",
    cart: "السلة",
    heroTitle: "Art Corner",
    heroSubtitle: "Hand crafted pieces made with love ❤️ — قطع ديكور وهدايا مميزة يدوية الصنع. تصفح التشكيلة كاملة واطلب اللي يعجبك مباشرة.",
    searchPlaceholder: "ابحث برقم المنتج...",
    sortDefault: "الترتيب الافتراضي",
    sortPriceAsc: "السعر: من الأقل للأعلى",
    sortPriceDesc: "السعر: من الأعلى للأقل",
    countSuffix: "منتج",
    addToCart: "أضف للسلة",
    addedToCart: "✓ اتضافت للسلة",
    orderNow: "اطلب مباشرة عبر واتساب",
    emptySearch: "مفيش منتجات مطابقة للبحث",
    cartTitle: "سلة المشتريات",
    cartEmpty: "السلة فاضية دلوقتي — اختاري أي لوحة وضيفيها 🎨",
    total: "الإجمالي",
    checkout: "إتمام الطلب عبر واتساب",
    remove: "حذف",
    footer: "Amira Art Corner &copy; 2026 — لطلب أي قطعة، تواصل معنا مباشرة عبر",
    footerAnd: "أو",
    whatsapp: "واتساب",
    facebook: "فيسبوك",
    langToggle: "English",
    productName: (id) => `تصميم يدوي #${id}`,
    checkoutIntro: "مرحبًا، عايزة أطلب القطع دي:",
    checkoutTotal: "الإجمالي",
    orderMsg: (name, price) => `مرحبًا، عايز أطلب: ${name} (${price})`,
  },
  en: {
    dir: "ltr",
    brand: "Amira Art Corner",
    navShop: "Shop",
    navAbout: "About",
    navContact: "Contact",
    fbLink: "Our Facebook Page",
    cart: "Cart",
    heroTitle: "Art Corner",
    heroSubtitle: "Hand crafted pieces made with love ❤️ — unique home decor and gifts. Browse the full collection and order what you love directly.",
    searchPlaceholder: "Search by product number...",
    sortDefault: "Default order",
    sortPriceAsc: "Price: low to high",
    sortPriceDesc: "Price: high to low",
    countSuffix: "products",
    addToCart: "Add to cart",
    addedToCart: "✓ Added",
    orderNow: "Order directly via WhatsApp",
    emptySearch: "No matching products",
    cartTitle: "Shopping Cart",
    cartEmpty: "Your cart is empty — pick a piece and add it 🎨",
    total: "Total",
    checkout: "Checkout via WhatsApp",
    remove: "Remove",
    footer: "Amira Art Corner &copy; 2026 — to order any piece, contact us directly via",
    footerAnd: "or",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    langToggle: "عربي",
    productName: (id) => `Handmade Design #${id}`,
    checkoutIntro: "Hello, I'd like to order these pieces:",
    checkoutTotal: "Total",
    orderMsg: (name, price) => `Hello, I'd like to order: ${name} (${price})`,
  }
};

function getLang() {
  return localStorage.getItem(LANG_KEY) || "ar";
}

function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
}

function t() {
  return TRANSLATIONS[getLang()];
}

function applyDocumentLang() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.documentElement.dir = TRANSLATIONS[lang].dir;
}
