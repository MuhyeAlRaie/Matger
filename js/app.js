/**
 * APP.JS - Core Application Logic
 * Handles Language Switching, Data Fetching, and UI Initialization
 */

// State Management
let currentLang = localStorage.getItem('lang') || 'ar';

// DOM Elements
const bannersContainer = document.getElementById('banners-container');
const categoriesGrid = document.getElementById('categories-grid');
const langDisplay = document.getElementById('current-lang');
const authLinksContainer = document.getElementById('auth-links');

// Static UI Translations (Inline to avoid external JSON files)
const translations = {
    ar: {
        store_name: "متجري",
        search_placeholder: "ابحث عن منتج...",
        install_app: "تثبيت التطبيق",
        login: "دخول",
        logout: "خروج",
        my_account: "حسابي",
        my_orders: "طلباتي",
        categories: "التصنيفات",
        featured_products: "المنتجات المميزة",
        new_products: "وصل حديثاً",
        view_all: "عرض الكل",
        cart: "السلة",
        add_to_cart: "أضف للسلة",
        read_more: "اقرأ المزيد",
        footer_desc: "أفضل متجر إلكتروني لتلبية جميع احتياجاتك بجودة عالية وأسعار منافسة.",
        links: "روابط سريعة",
        home: "الرئيسية",
        customer_service: "خدمة العملاء",
        contact_us: "اتصل بنا",
        shipping_policy: "سياسة الشحن",
        return_policy: "سياسة الاسترجاع",
        newsletter: "النشرة البريدية"
    },
    en: {
        store_name: "MyStore",
        search_placeholder: "Search products...",
        install_app: "Install App",
        login: "Login",
        logout: "Logout",
        my_account: "My Account",
        my_orders: "My Orders",
        categories: "Categories",
        featured_products: "Featured Products",
        new_products: "New Arrivals",
        view_all: "View All",
        cart: "Cart",
        add_to_cart: "Add to Cart",
        read_more: "Read More",
        footer_desc: "The best online store to meet all your needs with high quality and competitive prices.",
        links: "Quick Links",
        home: "Home",
        customer_service: "Customer Service",
        contact_us: "Contact Us",
        shipping_policy: "Shipping Policy",
        return_policy: "Return Policy",
        newsletter: "Newsletter"
    }
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    applyLanguageSettings();
    await loadBanners();
    await loadCategories();
    updateStaticTexts();
    checkUserSession();
});

// ==========================================
// LANGUAGE LOGIC
// ==========================================
function applyLanguageSettings() {
    const html = document.documentElement;
    html.lang = currentLang;
    html.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    
    // Update Language Display in Navbar
    if(langDisplay) langDisplay.textContent = currentLang.toUpperCase();

    // Swap Bootstrap CSS based on direction
    const bootstrapLink = document.querySelector('link[href*="bootstrap"]');
    if (bootstrapLink) {
        const version = "5.3.0";
        if (currentLang === 'ar') {
            bootstrapLink.href = `https://cdn.jsdelivr.net/npm/bootstrap@${version}/dist/css/bootstrap.rtl.min.css`;
        } else {
            bootstrapLink.href = `https://cdn.jsdelivr.net/npm/bootstrap@${version}/dist/css/bootstrap.min.css`;
        }
    }
}

// Function called by Header Dropdown
window.setLanguage = function(lang) {
    if (currentLang === lang) return;
    localStorage.setItem('lang', lang);
    location.reload(); // Reload to apply CSS direction and fetch new language content
}

function updateStaticTexts() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) {
            element.placeholder = translations[currentLang][key];
        }
    });
}

// ==========================================
// DATA FETCHING (SUPABASE)
// ==========================================

async function loadBanners() {
    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) throw error;
        renderBanners(data);
    } catch (err) {
        console.error("Error loading banners:", err.message);
    }
}

async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('id');

        if (error) throw error;
        renderCategories(data);
    } catch (err) {
        console.error("Error loading categories:", err.message);
    }
}

// ==========================================
// RENDERING FUNCTIONS
// ==========================================

function renderBanners(banners) {
    if (!banners || banners.length === 0) return;

    bannersContainer.innerHTML = banners.map((banner, index) => {
        const title = currentLang === 'ar' ? banner.title_ar : banner.title_en;
        const desc = currentLang === 'ar' ? banner.description_ar : banner.description_en;
        const activeClass = index === 0 ? 'active' : '';

        return `
            <div class="carousel-item ${activeClass}">
                <img src="${banner.image_url}" class="d-block w-100" alt="${title}">
                <div class="carousel-caption d-none d-md-block">
                    <h2>${title}</h2>
                    <p>${desc}</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderCategories(categories) {
    if (!categories || categories.length === 0) return;

    categoriesGrid.innerHTML = categories.map(cat => {
        const name = currentLang === 'ar' ? cat.name_ar : cat.name_en;
        // Fallback icon if image not uploaded yet
        const imgUrl = cat.image_url || `https://via.placeholder.com/150?text=${name}`;
        
        return `
            <div class="col-6 col-md-3 mb-3">
                <a href="category.html?id=${cat.id}" class="text-decoration-none text-dark">
                    <div class="category-card">
                        <img src="${imgUrl}" alt="${name}" class="category-img">
                        <h6 class="mb-0 fw-bold">${name}</h6>
                    </div>
                </a>
            </div>
        `;
    }).join('');
}

// ==========================================
// AUTH SESSION CHECK
// ==========================================
async function checkUserSession() {
    // This relies on auth.js logic, but we update the UI here
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user) {
        authLinksContainer.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user-circle me-1"></i> ${user.user_metadata?.full_name || 'User'}
                </a>
                <ul class="dropdown-menu dropdown-menu-${currentLang === 'ar' ? 'start' : 'end'}">
                    <li><a class="dropdown-item" href="admin/index.html">${translations[currentLang].my_account}</a></li>
                    <li><a class="dropdown-item" href="#" onclick="handleLogout()">${translations[currentLang].logout}</a></li>
                </ul>
            </li>
        `;
    } else {
        authLinksContainer.innerHTML = `
            <a class="nav-link" href="login.html"><i class="fas fa-user"></i> ${translations[currentLang].login}</a>
        `;
    }
}

// Global logout handler
window.handleLogout = async function() {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    localStorage.removeItem('cart'); // Optional: Clear cart on logout
    window.location.href = 'index.html';
}