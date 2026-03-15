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
        // =========================================
        // GENERAL
        // =========================================
        store_name: "لومي",
        loading: "جاري التحميل...",
        view_details: "عرض التفاصيل",
        search_placeholder: "بحث عن منتج...",
        install_app: "تثبيت التطبيق",
        
        // =========================================
        // NAVIGATION
        // =========================================
        nav_home: "الرئيسية",
        nav_categories: "الأقسام",
        nav_account: "حسابي",
        nav_cart: "السلة",
        logout: "تسجيل الخروج",
        login_title: "تسجيل الدخول",
        register_title: "إنشاء حساب جديد",

        // =========================================
        // PRODUCT & CATEGORY UI
        // =========================================
        categories: "الأقسام",
        featured_products: "منتجات مميزة",
        new_products: "وصل حديثاً",
        related_products: "منتجات ذات صلة",
        description: "الوصف",
        price: "السعر",
        currency: "دينار أردني",
        guarantee: "ضمان الجودة",
        
        // =========================================
        // ACTIONS & BUTTONS
        // =========================================
        add_to_cart: "أضف للسلة",
        buy_now: "اشتر الآن",
        checkout: "إتمام الشراء",
        cancel: "إلغاء",
        save: "حفظ",
        update: "تحديث",
        delete: "حذف",
        edit: "تعديل",
        view: "عرض",
        close: "إغلاق",
        apply: "تطبيق",
        place_order: "إتمام الطلب",
        view_all: "عرض الكل",

        // =========================================
        // CART UI
        // =========================================
        cart_empty: "سلة التسوق فارغة",
        subtotal: "المجموع الفرعي",
        shipping: "التوصيل",
        total: "الإجمالي",
        discount: "الخصم",
        apply_coupon: "تطبيق الكوبون",
        proceed_checkout: "إتمام الشراء",

        // =========================================
        // CHECKOUT UI
        // =========================================
        detect_location: "تحديد موقعي",
        shipping_info: "معلومات التوصيل",
        fill_fields: "يرجى ملء جميع الحقول",
        location_detected: "تم تحديد الموقع بنجاح",
        select_region: "اختر منطقة التوصيل",
        full_name: "الاسم الكامل",
        phone_number: "رقم الهاتف",
        delivery_address: "عنوان التوصيل",
        
        // =========================================
        // ACCOUNT UI
        // =========================================
        profile_info: "الملف الشخصي",
        order_history: "سجل الطلبات",
        security: "الأمان والخصوصية",
        change_password: "تغيير كلمة المرور",
        current_password: "كلمة المرور الحالية",
        new_password: "كلمة المرور الجديدة",
        confirm_password: "تأكيد كلمة المرور",
        update_profile: "تحديث الملف الشخصي",

        // =========================================
        // ADMIN PANEL
        // =========================================
        admin_dashboard: "لوحة التحكم",
        admin_products: "المنتجات",
        admin_orders: "الطلبات",
        admin_notifications: "الإشعارات",
        admin_regions: "المناطق",
        admin_coupons: "الكوبونات",
        
        // Admin Actions
        create_product: "إضافة منتج",
        create_category: "إضافة قسم",
        create_order: "إنشاء طلب",
        create_banner: "إضافة بانر",
        create_coupon: "إضافة كوبون",
        
        // Admin Success Messages
        product_saved: "تم حفظ المنتج",
        category_saved: "تم حفظ القسم",
        order_updated: "تم تحديث الطلب",
        
        // Map Feature
        view_map: "عرض في الخريطة",

        // Footer 

        footer_quick_link:"روابط سريعة",
         footer_quick_link1:"الرئيسية",
        footer_quick_link2:"الاقسام",
        footer_quick_link3:"حسابي",
        contact_us:"تواصل معنا",
        footer_desc:"وجهتك الأولى للتسوق الإلكتروني بتجربة عصرية وآمنة وأسعار لا تقبل المنافسة.",
    },
    en: {
        // =========================================
        // GENERAL
        // =========================================
        store_name: "Loomi",
        loading: "Loading...",
        view_details: "View Details",
        search_placeholder: "Search products...",
        install_app: "Install App",

        // =========================================
        // NAVIGATION
        // =========================================
        nav_home: "Home",
        nav_categories: "Categories",
        nav_account: "My Account",
        nav_cart: "Cart",
        logout: "Logout",
        login_title: "Login",
        register_title: "Create Account",

        // =========================================
        // PRODUCT & CATEGORY UI
        // =========================================
        categories: "Categories",
        featured_products: "Featured Products",
        new_products: "New Arrivals",
        related_products: "Related Products",
        description: "Description",
        price: "Price",
        currency: "JOD",
        guarantee: "Quality Guarantee",

        // =========================================
        // ACTIONS & BUTTONS
        // =========================================
        add_to_cart: "Add to Cart",
        buy_now: "Buy Now",
        checkout: "Checkout",
        cancel: "Cancel",
        save: "Save",
        update: "Update",
        delete: "Delete",
        edit: "Edit",
        view: "View",
        close: "Close",
        apply: "Apply",
        place_order: "Place Order",
        view_all: "View All",

        // =========================================
        // CART UI
        // =========================================
        cart_empty: "Your cart is empty",
        subtotal: "Subtotal",
        shipping: "Shipping",
        total: "Total",
        discount: "Discount",
        apply_coupon: "Apply Coupon",
        proceed_checkout: "Proceed to Checkout",

        // =========================================
        // CHECKOUT UI
        // =========================================
        detect_location: "Detect My Location",
        shipping_info: "Shipping Information",
        fill_fields: "Please fill all fields",
        location_detected: "Location detected successfully",
        select_region: "Select Delivery Region",
        full_name: "Full Name",
        phone_number: "Phone Number",
        delivery_address: "Delivery Address",

        // =========================================
        // ACCOUNT UI
        // =========================================
        profile_info: "Profile Info",
        order_history: "Order History",
        security: "Security & Password",
        change_password: "Change Password",
        current_password: "Current Password",
        new_password: "New Password",
        confirm_password: "Confirm New Password",
        update_profile: "Update Profile",

        // =========================================
        // ADMIN PANEL
        // =========================================
        admin_dashboard: "Dashboard",
        admin_products: "Products",
        admin_orders: "Orders",
        admin_notifications: "Notifications",
        admin_regions: "Regions",
        admin_coupons: "Coupons",

        // Admin Actions
        create_product: "Add Product",
        create_category: "Add Category",
        create_order: "Create Order",
        create_banner: "Add Banner",
        create_coupon: "Add Coupon",

        // Admin Success Messages
        product_saved: "Product saved successfully",
        category_saved: "Category saved successfully",
        order_updated: "Order updated successfully",

        // Map Feature
        view_map: "View on Map",

        // Footer 

        footer_quick_link:"Quick Links",
        footer_quick_link1:"Home",
        footer_quick_link2:"Category",
        footer_quick_link3:"My Account",
        contact_us:"Contatc Us",
        footer_desc:" Your First Online Store.",

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

    await loadSpecialOffers();

    // NEW: Load Discounted Products
    await loadDiscountedProducts();

        // NEW: Load Home Categories
    await loadHomeCategoriesCarousel();

     // NEW: Load Category Carousels
    await loadCategoryCarousels();

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
// SPECIAL OFFERS SLIDER (7 Seconds)
// ==========================================
let currentOfferIndex = 0;
let offersData = [];
let offerTimer = null;

async function loadSpecialOffers() {
    const container = document.getElementById('special-offers-container');
    const imgEl = document.getElementById('special-offers-img');
    const linkEl = document.getElementById('special-offers-link');

    try {
        // Fetch offers with product slug to build the link
        const { data: offers, error } = await supabase
            .from('special_offers')
            .select('*, products(slug)')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        if (!offers || offers.length === 0) {
            container.style.display = 'none';
            return;
        }

        offersData = offers;
        container.classList.remove('d-none');

        // Function to render a specific slide
        const renderOffer = (index) => {
            const offer = offersData[index];
            const imgUrl = offer.image_url || 'https://via.placeholder.com/1200x300';
            
            // Fade effect
            imgEl.style.opacity = '0';
            
            setTimeout(() => {
                imgEl.src = imgUrl;
                // Link to product page using slug
                if (offer.products && offer.products.slug) {
                    linkEl.href = `product.html?slug=${offer.products.slug}`;
                } else {
                    linkEl.href = '#';
                }
                
                // Fade in
                imgEl.onload = () => {
                    imgEl.style.opacity = '1';
                };
            }, 500); // Wait for fade out
        };

        // Show first image
        renderOffer(0);

        // Start Timer if more than 1 offer
        if (offersData.length > 1) {
            if (offerTimer) clearInterval(offerTimer);
            offerTimer = setInterval(() => {
                currentOfferIndex = (currentOfferIndex + 1) % offersData.length;
                renderOffer(currentOfferIndex);
            }, 7000); // 7000ms = 7 Seconds
        }

    } catch (err) {
        console.error("Error loading special offers:", err);
        container.style.display = 'none';
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