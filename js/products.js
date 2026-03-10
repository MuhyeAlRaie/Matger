/**
 * PRODUCTS.JS - Product Display Logic
 * Fetches products from Supabase and renders them (Grid, Modal, Page Details)
 */

const currentLang = localStorage.getItem('lang') || 'ar';
const nameField = currentLang === 'ar' ? 'name_ar' : 'name_en';
const shortDescField = currentLang === 'ar' ? 'short_description_ar' : 'short_description_en';
const fullDescField = currentLang === 'ar' ? 'full_description_ar' : 'full_description_en';

// ==========================================
// FETCHING PRODUCTS
// ==========================================

/**
 * Fetch products with optional filters
 * @param {Object} filters - { category_id, search_query, is_featured, limit }
 */
async function fetchProducts(filters = {}) {
    let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

    if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
    }

    if (filters.search) {
        // Search in both Arabic and English names
        query = query.or(`name_ar.ilike.%${filters.search}%,name_en.ilike.%${filters.search}%`);
    }

    if (filters.is_featured) {
        query = query.eq('is_featured', true);
    }

    if (filters.sort_new) {
        query = query.order('created_at', { ascending: false });
    } else {
        query = query.order('id', { ascending: true }); // Default order
    }

    if (filters.limit) {
        query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching products:", error);
        return [];
    }

    return data;
}

// ==========================================
// RENDERING PRODUCT CARDS
// ==========================================

function renderProductCards(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5 text-muted">لا توجد منتجات متاحة حالياً / No products found.</div>`;
        return;
    }

    container.innerHTML = products.map(product => createProductCardHTML(product)).join('');
    
    // Re-attach event listeners for dynamic content
    attachCartEvents();
}

function createProductCardHTML(product) {
    const title = product[nameField];
    const desc = product[shortDescField];
    const price = parseFloat(product.price).toFixed(2);
    const hasDiscount = product.discount_price && product.discount_price < product.price;
    const finalPrice = hasDiscount ? parseFloat(product.discount_price).toFixed(2) : price;
    
    // Handle image fallback
    const imgUrl = product.main_image_url || `https://via.placeholder.com/300x300?text=${title}`;

    // Discount Badge
    const discountBadge = hasDiscount 
        ? `<span class="badge-discount">-${Math.round(((product.price - product.discount_price) / product.price) * 100)}%</span>` 
        : '';

    // Old Price Display
    const priceDisplay = hasDiscount
        ? `<span class="product-old-price">${price} JOD</span> ${finalPrice} JOD`
        : `${finalPrice} JOD`;

    return `
        <div class="col">
            <div class="product-card h-100">
                <div class="product-img-wrapper" onclick="openProductModal(${product.id})" style="cursor: pointer;">
                    ${discountBadge}
                    <img src="${imgUrl}" alt="${title}">
                </div>
                <div class="product-body">
                    <h5 class="product-title" onclick="openProductModal(${product.id})" style="cursor: pointer;" title="${title}">
                        ${title}
                    </h5>
                    <p class="text-muted small text-truncate mb-2">${desc}</p>
                    <div class="product-price">
                        ${priceDisplay}
                    </div>
                    <button class="btn btn-primary btn-add-cart mt-2" onclick="addToCartFromPage(this, ${product.id})">
                        <i class="fas fa-cart-plus me-1"></i> ${currentLang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                    </button>
                    <!-- Hidden data to store product info for easy cart access -->
                    <div class="d-none" 
                         data-id="${product.id}" 
                         data-name="${title}" 
                         data-price="${finalPrice}" 
                         data-image="${imgUrl}"
                         data-slug="${product.slug}">
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Helper to attach events after HTML injection
function attachCartEvents() {
    // Logic handled by inline onclick="addToCartFromPage" for simplicity in this architecture
}

// Wrapper to call global addToCart from cart.js using data attributes
window.addToCartFromPage = function(btnElement, productId) {
    // In a real app, we might re-fetch from DB to ensure latest price/stock
    // Here we use the data embedded in the card for speed
    const container = btnElement.nextElementSibling;
    
    const product = {
        id: container.dataset.id,
        name: container.dataset.name, // Single language snapshot for cart
        price: parseFloat(container.dataset.price),
        main_image_url: container.dataset.image,
        slug: container.dataset.slug
    };

    // Check if global addToCart exists (from cart.js)
    if (typeof addToCart === 'function') {
        addToCart(product);
    } else {
        console.error("Cart logic not loaded yet.");
    }
}

// ==========================================
// PRODUCT MODAL LOGIC
// ==========================================

let productsCache = []; // Cache to avoid refetching for modal

async function openProductModal(productId) {
    // Try to find in cache first, otherwise fetch
    let product = productsCache.find(p => p.id == productId);
    
    if (!product) {
        // Fetch specific product
        const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
        if (error) return console.error(error);
        product = data;
    }

    const title = product[nameField];
    const fullDesc = product[fullDescField] || product[shortDescField];
    const price = parseFloat(product.price).toFixed(2);
    const hasDiscount = product.discount_price && product.discount_price < product.price;
    const finalPrice = hasDiscount ? parseFloat(product.discount_price).toFixed(2) : price;
    const imgUrl = product.main_image_url || `https://via.placeholder.com/600x400?text=${title}`;

    const modalTitle = document.getElementById('modalProductTitle');
    const modalBody = document.getElementById('modalProductBody');

    modalTitle.textContent = title;
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <img src="${imgUrl}" class="img-fluid rounded mb-3" alt="${title}">
            </div>
            <div class="col-md-6">
                <h3 class="text-primary fw-bold">${finalPrice} JOD</h3>
                ${hasDiscount ? `<p class="text-danger text-decoration-line-through">${price} JOD</p>` : ''}
                <hr>
                <p class="lead">${fullDesc}</p>
                <button class="btn btn-success w-100 btn-lg" onclick="addToCartFromPage(this, ${product.id})">
                    <i class="fas fa-cart-plus me-2"></i> ${currentLang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                </button>
                 <!-- Hidden data for cart -->
                 <div class="d-none" 
                         data-id="${product.id}" 
                         data-name="${title}" 
                         data-price="${finalPrice}" 
                         data-image="${imgUrl}"
                         data-slug="${product.slug}"></div>
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// ==========================================
// SINGLE PRODUCT PAGE LOGIC (product.html)
// ==========================================

async function loadProductPage() {
    // Check if we are on the product page
    if (!document.getElementById('product-page-container')) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        window.location.href = 'index.html';
        return;
    }

    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !product) {
        document.getElementById('product-page-container').innerHTML = `
            <div class="alert alert-danger text-center m-5">
                <h4>Product Not Found</h4>
                <a href="index.html" class="btn btn-primary">Go Home</a>
            </div>
        `;
        return;
    }

    // Update Page Meta (SEO)
    document.title = `${product[nameField]} | MyStore`;
    
    // Update JSON-LD
    updateProductSchema(product);

    // Render Product Details
    const title = product[nameField];
    const desc = product[fullDescField];
    const price = parseFloat(product.price).toFixed(2);
    const hasDiscount = product.discount_price && product.discount_price < product.price;
    const finalPrice = hasDiscount ? parseFloat(product.discount_price).toFixed(2) : price;
    const imgUrl = product.main_image_url || `https://via.placeholder.com/600x600?text=${title}`;

    const container = document.getElementById('product-page-container');
    container.innerHTML = `
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="index.html">Home</a></li>
                <li class="breadcrumb-item"><a href="category.html?id=${product.category_id}">Category</a></li>
                <li class="breadcrumb-item active" aria-current="page">${title}</li>
            </ol>
        </nav>
        
        <div class="row align-items-center">
            <div class="col-md-6 mb-4">
                <img src="${imgUrl}" class="img-fluid rounded shadow-sm" alt="${title}" id="main-product-image">
            </div>
            <div class="col-md-6">
                <h1 class="mb-3 fw-bold">${title}</h1>
                <div class="mb-4">
                    ${hasDiscount 
                        ? `<span class="h3 text-success fw-bold">${finalPrice} JOD</span> 
                           <span class="text-muted text-decoration-line-through h5 ms-2">${price} JOD</span>
                           <span class="badge bg-danger ms-2">Save ${Math.round(((product.price - product.discount_price)/product.price)*100)}%</span>`
                        : `<span class="h3 text-primary fw-bold">${price} JOD</span>`
                    }
                </div>
                
                <div class="mb-4">
                    <h5>${currentLang === 'ar' ? 'الوصف' : 'Description'}:</h5>
                    <p class="text-secondary">${desc}</p>
                </div>

                <div class="d-grid gap-2 col-md-8">
                    <button class="btn btn-primary btn-lg" onclick="addToCartFromPage(this, ${product.id})">
                        <i class="fas fa-shopping-cart me-2"></i> ${currentLang === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                    </button>
                     <!-- Hidden data for cart -->
                     <div class="d-none" 
                         data-id="${product.id}" 
                         data-name="${title}" 
                         data-price="${finalPrice}" 
                         data-image="${imgUrl}"
                         data-slug="${product.slug}"></div>
                </div>
            </div>
        </div>
    `;
}

// Update Schema.org JSON-LD for Product Page
function updateProductSchema(product) {
    const schema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product[nameField],
        "image": [product.main_image_url],
        "description": product[fullDescField],
        "sku": product.id.toString(),
        "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "JOD",
            "price": product.discount_price || product.price,
            "availability": "https://schema.org/InStock"
        }
    };
    
    // Find existing script tag or create new
    let scriptTag = document.getElementById('product-json-ld');
    if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'product-json-ld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schema);
}

// Init on DOM Load
document.addEventListener('DOMContentLoaded', async () => {
    // Load Featured on Homepage
    if (document.getElementById('featured-products')) {
        const featured = await fetchProducts({ is_featured: true, limit: 4 });
        productsCache = [...productsCache, ...featured];
        renderProductCards(featured, 'featured-products');
    }

    // Load New on Homepage
    if (document.getElementById('new-products')) {
        const newProducts = await fetchProducts({ sort_new: true, limit: 4 });
        productsCache = [...productsCache, ...newProducts];
        renderProductCards(newProducts, 'new-products');
    }

    // Load Single Product Page
    await loadProductPage();
});