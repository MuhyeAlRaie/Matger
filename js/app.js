/**
 * Core Application Logic
 * Handles:
 * 1. Language Switching (Arabic/English) & RTL/LTR Layout
 * 2. UI Label Translations
 * 3. Global Utilities (Toasts, Loading)
 * 4. Homepage Banners fetching
 */

// ==========================================
// 1. Translations Dictionary (Static UI)
// ==========================================
const i18n = {
    ar: {
        store_name: "متجري",
        nav_home: "الرئيسية",
        nav_categories: "الأقسام",
        nav_account: "حسابي",
        nav_cart: "السلة",
        search_placeholder: "بحث عن منتج...",
        install_app: "تثبيت التطبيق",
        categories: "الأقسام",
        featured_products: "منتجات مميزة",
        new_products: "وصل حديثاً",
        footer_about: "عن المتجر",
        footer_desc: "نقدم أفضل المنتجات بأفضل الأسعار مع خدمة توصيل سريعة.",
        footer_links: "روابط سريعة",
        footer_contact: "تواصل معنا",
        location: "الأردن",
        add_to_cart: "أضف للسلة",
        price: "السعر",
        currency: "دينار أردني",
        loading: "جاري التحميل...",
        view_details: "عرض التفاصيل",
        login_title: "تسجيل الدخول",
        register_title: "إنشاء حساب جديد",
        logout: "تسجيل الخروج"
    },
    en: {
        store_name: "MyStore",
        nav_home: "Home",
        nav_categories: "Categories",
        nav_account: "My Account",
        nav_cart: "Cart",
        search_placeholder: "Search products...",
        install_app: "Install App",
        categories: "Categories",
        featured_products: "Featured Products",
        new_products: "New Arrivals",
        footer_about: "About Us",
        footer_desc: "We offer the best products at competitive prices with fast delivery.",
        footer_links: "Quick Links",
        footer_contact: "Contact Us",
        location: "Jordan",
        add_to_cart: "Add to Cart",
        price: "Price",
        currency: "JOD",
        loading: "Loading...",
        view_details: "View Details",
        login_title: "Login",
        register_title: "Create Account",
        logout: "Logout"
    }
};

// ==========================================
// 2. State & Initialization
// ==========================================
let currentLang = localStorage.getItem('app_language') || 'ar'; // Default Arabic

document.addEventListener('DOMContentLoaded', async () => {
    console.log('App Initializing...');
    
    // Apply Language
    applyLanguage(currentLang);

    // Setup Language Switcher Event
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }

    // Fetch Homepage Data (Banners)
    await loadBanners();

    // Initialize other modules if they exist and have init functions
    // (Assuming cart.js and auth.js run their own logic on load, 
    // but we can trigger updates here if needed)
    if (typeof updateCartCountUI === 'function') updateCartCountUI();
    if (typeof checkAuthSession === 'function') checkAuthSession();
});

// ==========================================
// 3. Language Logic
// ==========================================
function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('app_language', currentLang);
    applyLanguage(currentLang);
    // Reload page to re-fetch content with new language preference from DB
    window.location.reload();
}

function applyLanguage(lang) {
    const html = document.documentElement;
    const langBtn = document.getElementById('lang-toggle');
    
    // Set Direction and Lang Attribute
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // Update Button Text
    if (langBtn) {
        langBtn.textContent = lang === 'ar' ? 'English' : 'العربية';
    }

    // Replace Text Content for elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (i18n[lang][key]) {
            element.textContent = i18n[lang][key];
        }
    });
    
    // Update Bootstrap CSS Direction
    // Bootstrap requires removing the old stylesheet and adding the new one for RTL/LTR flip
    const bootstrapLink = document.querySelector('link[href*="bootstrap"]');
    if (bootstrapLink) {
        if (lang === 'ar') {
            bootstrapLink.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css";
        } else {
            bootstrapLink.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";
        }
    }
}

// ==========================================
// 4. Banners Logic
// ==========================================
async function loadBanners() {
    // FIX: Only run if we are on the homepage (where banner-section exists)
    const bannerSection = document.getElementById('banner-section');
    if (!bannerSection) return; 
    
    try {
        // ... rest of the function stays the same
        const { data: banners, error } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (banners && banners.length > 0) {
            // Build Bootstrap Carousel
            let carouselHTML = `
            <div id="mainCarousel" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-indicators">`;
            
            // Indicators
            banners.forEach((_, index) => {
                carouselHTML += `<button type="button" data-bs-target="#mainCarousel" data-bs-slide-to="${index}" class="${index === 0 ? 'active' : ''}" aria-label="Slide ${index + 1}"></button>`;
            });

            carouselHTML += `</div><div class="carousel-inner">`;

            // Slides
            banners.forEach((banner, index) => {
                const title = currentLang === 'ar' ? banner.title_ar : banner.title_en;
                const desc = currentLang === 'ar' ? banner.description_ar : banner.description_en;
                const activeClass = index === 0 ? 'active' : '';

                carouselHTML += `
                <div class="carousel-item ${activeClass}">
                    <div class="banner-slide" style="background-image: url('${banner.image_url}');">
                        <div class="banner-content">
                            <h1>${title}</h1>
                            <p class="lead">${desc}</p>
                            ${banner.link ? `<a href="${banner.link}" class="btn btn-primary btn-lg">${i18n[currentLang].view_details}</a>` : ''}
                        </div>
                    </div>
                </div>`;
            });

            carouselHTML += `
                </div>
                <button class="carousel-control-prev" type="button" data-bs-target="#mainCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#mainCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Next</span>
                </button>
            </div>`;

            bannerSection.innerHTML = carouselHTML;
        } else {
            bannerSection.style.display = 'none'; // Hide if no banners
        }
    } catch (err) {
        console.error("Error loading banners:", err);
        // Keep placeholder or hide
        bannerSection.innerHTML = `<div class="alert alert-warning m-3">Error loading banners. Please check console.</div>`;
    }
}

// ==========================================
// 5. Global Utilities
// ==========================================
function showToast(message, type = 'primary') {
    const container = document.getElementById('toast-container');
    const bgClass = type === 'success' ? 'text-bg-success' : 
                    type === 'danger' ? 'text-bg-danger' : 'text-bg-primary';

    const toastHTML = `
        <div class="toast align-items-center ${bgClass} border-0 show toast-show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = toastHTML;
    const toastEl = wrapper.firstElementChild;
    
    container.appendChild(toastEl);

    // Remove after 3 seconds
    setTimeout(() => {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.remove(), 500);
    }, 3000);
}

function toggleLoading(show) {
    let loader = document.getElementById('loading-overlay');
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loading-overlay';
            loader.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    } else {
        if (loader) loader.style.display = 'none';
    }
}