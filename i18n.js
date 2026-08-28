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
    welcomeMsg: "مرحبًا بيكم في عالم Art Corner المميز 🎨 جاهزين لاستفساراتكم",
    liveBrowsing: "بيتصفحوا المتجر دلوقتي",
    pinnedShowing: "بتشوف القطعة اللي اخترتها من الإعلان 👇",
    viewAllProducts: "عرض كل المنتجات",
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
    welcomeMsg: "Welcome to the wonderful world of Art Corner 🎨 We're ready for your questions",
    liveBrowsing: "browsing the store right now",
    pinnedShowing: "Showing the piece you picked from the ad 👇",
    viewAllProducts: "View all products",
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
