const LANG_KEY = "amira_lang";

const TRANSLATIONS = {
  ar: {
    dir: "rtl",
    brand: "Art Corner",
    navShop: "المتجر",
    navAbout: "من نحن",
    navContact: "تواصل معنا",
    fbLink: "صفحتنا على فيسبوك",
    heroTitle: "ديكورات ولوحات وهدايا يدوية الصنع | Art Corner",
    heroSubtitle: "Hand crafted pieces made with love ❤️ — قطع ديكور وهدايا مميزة يدوية الصنع. تصفح التشكيلة كاملة واطلب اللي يعجبك مباشرة.",
    searchPlaceholder: "ابحث برقم المنتج...",
    sortSelectLabel: "ترتيب المنتجات",
    sortDefault: "الترتيب الافتراضي",
    sortPriceAsc: "السعر: من الأقل للأعلى",
    sortPriceDesc: "السعر: من الأعلى للأقل",
    countSuffix: "منتج",
    orderNow: "اطلب من خلال واتساب الآن",
    soldOut: "نفدت الكمية",
    loading: "جاري تحميل المنتجات...",
    emptySearch: "مفيش منتجات مطابقة للبحث",
    footer: "Art Corner &copy; 2026 — لطلب أي قطعة، تواصل معنا مباشرة عبر",
    footerAnd: "أو",
    whatsapp: "واتساب",
    facebook: "فيسبوك",
    langToggle: "English",
    productName: (id) => `تصميم يدوي #${id}`,
    orderMsg: (name, price) => `مرحبًا، عايز أطلب: ${name} (${price})`,
    liveBrowsing: "بيتصفحوا المتجر دلوقتي",
  },
  en: {
    dir: "ltr",
    brand: "Art Corner",
    navShop: "Shop",
    navAbout: "About",
    navContact: "Contact",
    fbLink: "Our Facebook Page",
    heroTitle: "Handmade Home Decor, Paintings & Gifts | Art Corner",
    heroSubtitle: "Hand crafted pieces made with love ❤️ — unique home decor and gifts. Browse the full collection and order what you love directly.",
    searchPlaceholder: "Search by product number...",
    sortSelectLabel: "Sort products",
    sortDefault: "Default order",
    sortPriceAsc: "Price: low to high",
    sortPriceDesc: "Price: high to low",
    countSuffix: "products",
    orderNow: "Order via WhatsApp",
    soldOut: "Sold Out",
    loading: "Loading products...",
    emptySearch: "No matching products",
    footer: "Art Corner &copy; 2026 — to order any piece, contact us directly via",
    footerAnd: "or",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    langToggle: "عربي",
    productName: (id) => `Handmade Design #${id}`,
    orderMsg: (name, price) => `Hello, I'd like to order: ${name} (${price})`,
    liveBrowsing: "browsing the store right now",
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
