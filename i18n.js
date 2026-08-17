const LANG_KEY = "amira_lang";

const TRANSLATIONS = {
  ar: {
    dir: "rtl",
    brand: "Art Corner",
    navShop: "المتجر",
    navAbout: "من نحن",
    navContact: "تواصل معنا",
    fbLink: "صفحتنا على فيسبوك",
    cart: "السلة",
    heroTitle: "ديكورات ولوحات وهدايا يدوية الصنع | Art Corner",
    heroSubtitle: "Hand crafted pieces made with love ❤️ — قطع ديكور وهدايا مميزة يدوية الصنع. تصفح التشكيلة كاملة واطلب اللي يعجبك مباشرة.",
    searchPlaceholder: "ابحث برقم المنتج...",
    sortSelectLabel: "ترتيب المنتجات",
    sortDefault: "الترتيب الافتراضي",
    sortPriceAsc: "السعر: من الأقل للأعلى",
    sortPriceDesc: "السعر: من الأعلى للأقل",
    countSuffix: "منتج",
    addToCart: "أضف للسلة",
    addedToCart: "✓ اتضافت للسلة",
    orderNow: "اطلب الآن",
    soldOut: "نفدت الكمية",
    loading: "جاري تحميل المنتجات...",
    emptySearch: "مفيش منتجات مطابقة للبحث",
    cartTitle: "سلة المشتريات",
    cartEmpty: "السلة فاضية دلوقتي — اختاري أي لوحة وضيفيها 🎨",
    total: "الإجمالي",
    checkout: "تأكيد الطلب",
    remove: "حذف",
    footer: "Art Corner &copy; 2026 — لطلب أي قطعة، تواصل معنا مباشرة عبر",
    footerAnd: "أو",
    whatsapp: "واتساب",
    facebook: "فيسبوك",
    langToggle: "English",
    productName: (id) => `تصميم يدوي #${id}`,
    subtotal: "الإجمالي قبل الشحن",
    shippingFee: "مصاريف الشحن",
    ckName: "الاسم بالكامل",
    ckPhone: "رقم الموبايل",
    ckGovernorate: "المحافظة",
    ckGovernoratePlaceholder: "اختر المحافظة",
    ckAddress: "العنوان بالتفصيل",
    ckAddressPlaceholder: "الشارع، رقم العمارة والدور، أقرب علامة مميزة...",
    ckNotes: "ملاحظات (اختياري)",
    paymentNote: "💵 الدفع عند الاستلام (شامل مصاريف الشحن)",
    checkoutSubmitting: "جاري إرسال الطلب...",
    checkoutSuccessTitle: "تم استلام طلبك بنجاح ✅",
    checkoutSuccessBody: (orderId, total) => `رقم الطلب: ${orderId}\nالإجمالي: ${total}\nهنتواصل معاك على واتساب لتأكيد التوصيل.`,
    checkoutSuccessClose: "تمام",
    checkoutErrorGeneric: "حصل خطأ، حاول تاني أو تواصل معانا على واتساب",
    ckSelectGovernorateFirst: "اختر المحافظة الأول عشان نحسب الشحن",
  },
  en: {
    dir: "ltr",
    brand: "Art Corner",
    navShop: "Shop",
    navAbout: "About",
    navContact: "Contact",
    fbLink: "Our Facebook Page",
    cart: "Cart",
    heroTitle: "Handmade Home Decor, Paintings & Gifts | Art Corner",
    heroSubtitle: "Hand crafted pieces made with love ❤️ — unique home decor and gifts. Browse the full collection and order what you love directly.",
    searchPlaceholder: "Search by product number...",
    sortSelectLabel: "Sort products",
    sortDefault: "Default order",
    sortPriceAsc: "Price: low to high",
    sortPriceDesc: "Price: high to low",
    countSuffix: "products",
    addToCart: "Add to cart",
    addedToCart: "✓ Added",
    orderNow: "Order now",
    soldOut: "Sold Out",
    loading: "Loading products...",
    emptySearch: "No matching products",
    cartTitle: "Shopping Cart",
    cartEmpty: "Your cart is empty — pick a piece and add it 🎨",
    total: "Total",
    checkout: "Confirm order",
    remove: "Remove",
    footer: "Art Corner &copy; 2026 — to order any piece, contact us directly via",
    footerAnd: "or",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    langToggle: "عربي",
    productName: (id) => `Handmade Design #${id}`,
    subtotal: "Subtotal",
    shippingFee: "Shipping fee",
    ckName: "Full name",
    ckPhone: "Mobile number",
    ckGovernorate: "Governorate",
    ckGovernoratePlaceholder: "Select governorate",
    ckAddress: "Full address",
    ckAddressPlaceholder: "Street, building & floor, nearest landmark...",
    ckNotes: "Notes (optional)",
    paymentNote: "💵 Cash on delivery (shipping included)",
    checkoutSubmitting: "Sending your order...",
    checkoutSuccessTitle: "Order received ✅",
    checkoutSuccessBody: (orderId, total) => `Order #: ${orderId}\nTotal: ${total}\nWe'll reach out on WhatsApp to confirm delivery.`,
    checkoutSuccessClose: "OK",
    checkoutErrorGeneric: "Something went wrong, please try again or message us on WhatsApp",
    ckSelectGovernorateFirst: "Select a governorate first to calculate shipping",
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
