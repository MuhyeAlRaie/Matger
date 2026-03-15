/**
 * Products & Categories Logic
 * Handles fetching data from Supabase and rendering it to the DOM.
 * Depends on 'app.js' for 'currentLang' and 'supabase-config.js' for 'supabase'.
 */

// ==========================================
// 1. Helpers
// ==========================================

// Helper to get the correct language field from a database object
function getLocalizedField(obj, fieldName) {
    const suffix = currentLang === 'ar' ? 'ar' : 'en';
    return obj[`${fieldName}_${suffix}`] || obj[`${fieldName}_ar`]; // Fallback to Arabic
}

// Format Currency
function formatPrice(price) {
    return parseFloat(price).toFixed(2) + ' ' + (currentLang === 'ar' ? 'د.أ' : 'JOD');
}

// ==========================================
// 2. Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    setupSearch();
});

// ==========================================
// 3. Categories Logic
// ==========================================
async function loadCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        container.innerHTML = categories.map(cat => createCategoryCard(cat)).join('');

    } catch (err) {
        console.error("Error loading categories:", err);
        container.innerHTML = `<div class="alert alert-danger">Error loading categories</div>`;
    }
}

function createCategoryCard(category) {
    const name = getLocalizedField(category, 'name');
    const slug = category.slug;
    // Using a placeholder icon if image is missing, or the category image
    const imgUrl = category.image_url || `https://picsum.photos/seed/${slug}/200/200`;

    return `
        <div class="col-6 col-md-3">
            <a href="category.html?slug=${slug}" class="category-card">
                <div class="category-icon">
                    <i class="bi bi-tag"></i> 
                </div>
                <h5 class="mb-0">${name}</h5>
            </a>
        </div>
    `;
}

// ==========================================
// 4. Products Logic
// ==========================================
async function loadProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    try {
        // Fetch products with category info
        const { data: products, error } = await supabase
            .from('products')
            .select(`
                *,
                categories (slug)
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(8); // Limit to 8 for homepage

        if (error) throw error;

        if (products.length === 0) {
            container.innerHTML = `<div class="col-12 text-center text-muted">No products found.</div>`;
            return;
        }

        container.innerHTML = products.map(prod => createProductCard(prod)).join('');

    } catch (err) {
        console.error("Error loading products:", err);
        container.innerHTML = `<div class="alert alert-danger">Error loading products</div>`;
    }
}

function createProductCard(product) {
    const title = getLocalizedField(product, 'name');
    const shortDesc = getLocalizedField(product, 'short_description');
    const slug = product.slug;
    const categorySlug = product.categories ? product.categories.slug : 'all';
    
    // Image Logic: Database stores URL. If it starts with /images, it's local.
    // Otherwise it might be a full URL.
    const imageUrl = product.image_url || 'https://via.placeholder.com/300';

    // Price Logic
    const hasDiscount = product.discount_price && product.discount_price < product.price;
    const displayPrice = hasDiscount ? product.discount_price : product.price;
    
    return `
        <div class="col-6 col-md-4 col-lg-3">
            <div class="product-card h-100">
                <a href="product.html?slug=${slug}" class="text-decoration-none text-dark">
                    <div class="product-image-wrapper">
                        <img src="${imageUrl}" alt="${title}" loading="lazy">
                        ${hasDiscount ? `<span class="discount-badge">-${Math.round(((product.price - product.discount_price) / product.price) * 100)}%</span>` : ''}
                    </div>
                </a>
                <div class="card-body">
                    <a href="category.html?slug=${categorySlug}" class="text-decoration-none text-muted small" style="text-transform: uppercase; font-size: 0.75rem;">
                        ${getLocalizedField(product, 'category_name_placeholder')}
                    </a>
                    <a href="product.html?slug=${slug}" class="text-decoration-none text-dark">
                        <h5 class="product-title">${title}</h5>
                    </a>
                    <p class="small text-muted mb-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${shortDesc}
                    </p>
                    
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <div class="product-price">
                            ${hasDiscount ? `<span class="old-price">${formatPrice(product.price)}</span>` : ''}
                            ${formatPrice(displayPrice)}
                        </div>
                    </div>
                    
                    <button onclick="addToCart(${product.id})" class="btn btn-primary w-100 mt-3 btn-sm">
                        <i class="bi bi-cart-plus"></i> ${i18n[currentLang].add_to_cart}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 5. Search Logic
// ==========================================
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = searchInput ? searchInput.nextElementSibling : null;

    if (searchBtn && searchInput) {
        const performSearch = () => {
            const query = searchInput.value.trim();
            if (query) {
                // Redirect to category page with search query parameter
                // (category.html will need to be updated to handle 'search' param)
                window.location.href = `category.html?search=${encodeURIComponent(query)}`;
            }
        };

        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
}

// ==========================================
// LOAD DISCOUNTED PRODUCTS (Sales Section)
// ==========================================
async function loadDiscountedProducts() {
    const container = document.getElementById('discounted-products-section');
    const carousel = container.querySelector('.category-carousel');
    
    // Set Title based on Language
    document.getElementById('sales-title').textContent = currentLang === 'ar' ? 'تخفيضات' : 'Flash Sales';

    if (!carousel) return;

    try {
        // Fetch products where discount_price is greater than 0
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .gt('discount_price', 0) // Only fetch discounted items
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (!products || products.length === 0) {
            // Hide section if no sales exist
            container.style.display = 'none';
            return;
        }

        // Build Cards
        let html = '';
        products.forEach(prod => {
            const name = getLocalizedField(prod, 'name');
            const desc = getLocalizedField(prod, 'short_description');
            
            // Double check price logic
            const hasDiscount = prod.discount_price && prod.discount_price > 0 && prod.discount_price < prod.price;
            const price = hasDiscount ? prod.discount_price : prod.price;
            
            const imgUrl = prod.image_url || 'https://via.placeholder.com/300';

            html += `
            <div class="carousel-card">
                <div class="product-card h-100">
                    <a href="product.html?slug=${prod.slug}" class="text-decoration-none text-dark">
                        <div class="product-image-wrapper">
                            <img src="${imgUrl}" alt="${name}" loading="lazy">
                            ${hasDiscount ? `<span class="discount-badge">-${Math.round(((prod.price - prod.discount_price) / prod.price) * 100)}%</span>` : ''}
                        </div>
                        <div class="card-body p-2">
                            <h5 class="product-title" style="font-size: 0.9rem; height: 2.2em;">${name}</h5>
                            
                            <p class="product-short-desc">${desc || ''}</p>
                            
                            <div class="product-price" style="font-size: 0.9rem; margin-bottom: 0.5rem;">
                                <span class="old-price" style="font-size: 0.8rem;">${formatPrice(prod.price)}</span>
                                ${formatPrice(price)}
                            </div>
                            <button onclick="addToCart(${prod.id})" class="btn btn-primary w-100 btn-sm" style="font-size: 0.8rem; padding: 4px 10px;">
                                ${i18n[currentLang].add_to_cart}
                            </button>
                        </div>
                    </a>
                </div>
            </div>`;
        });

        carousel.innerHTML = html;

    } catch (err) {
        console.error("Error loading sales:", err);
        container.style.display = 'none';
    }
}

// ==========================================
// LOAD CATEGORY CAROUSELS (Optimized)
// ==========================================
async function loadCategoryCarousels() {
    const container = document.getElementById('dynamic-category-sections');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

    try {
        // 1. Fetch Categories
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

        if (catError) throw catError;

        // 2. Fetch All Active Products
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true);

        if (prodError) throw prodError;

        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No categories found.</div>';
            return;
        }

        // 3. Group Products by Category ID
        const productsByCategory = {};
        products.forEach(prod => {
            if (!productsByCategory[prod.category_id]) {
                productsByCategory[prod.category_id] = [];
            }
            productsByCategory[prod.category_id].push(prod);
        });

        // 4. Build HTML for each Category
        let html = '';

        categories.forEach(cat => {
            const catProducts = productsByCategory[cat.category_id || cat.id] || [];
            
            // Skip category if it has no products
            if (catProducts.length === 0) return;

            const catName = currentLang === 'ar' ? cat.name_ar : cat.name_en;
            const viewAllText = i18n[currentLang].view_all;

             // Generate Cards HTML
            let cardsHtml = '';
            catProducts.slice(0, 10).forEach(prod => { 
                const name = getLocalizedField(prod, 'name');
                const desc = getLocalizedField(prod, 'short_description'); // Get description
                
                const price = prod.discount_price && prod.discount_price > 0 && prod.discount_price < prod.price ? prod.discount_price : prod.price;
                const hasDiscount = prod.discount_price && prod.discount_price > 0 && prod.discount_price < prod.price;
                const imgUrl = prod.image_url || 'https://via.placeholder.com/300';

                cardsHtml += `
                <div class="carousel-card">
                    <div class="product-card h-100">
                        <a href="product.html?slug=${prod.slug}" class="text-decoration-none text-dark">
                            <div class="product-image-wrapper">
                                <img src="${imgUrl}" alt="${name}" loading="lazy">
                                ${hasDiscount ? `<span class="discount-badge">-${Math.round(((prod.price - prod.discount_price) / prod.price) * 100)}%</span>` : ''}
                            </div>
                            <div class="card-body p-2">
                                <h5 class="product-title" style="font-size: 0.9rem; height: 2.2em;">${name}</h5>
                                
                                <!-- NEW: Short Description -->
                                <p class="product-short-desc">${desc || ''}</p>
                                
                                <div class="product-price" style="font-size: 0.9rem; margin-bottom: 0.5rem;">
                                    <!-- UPDATED: Added Currency to Old Price -->
                                    ${hasDiscount ? `<span class="old-price" style="font-size: 0.8rem;">${formatPrice(prod.price)}</span>` : ''}
                                    ${formatPrice(price)}
                                </div>
                                <button onclick="addToCart(${prod.id})" class="btn btn-primary w-100 btn-sm" style="font-size: 0.8rem; padding: 4px 10px;">
                                    ${i18n[currentLang].add_to_cart}
                                </button>
                            </div>
                        </a>
                    </div>
                </div>`;
            });

            // Wrap in Section
            html += `
            <div class="carousel-section">
                <div class="d-flex justify-content-between align-items-end mb-3">
                    <h2 class="section-title mb-0" style="font-size: 1.5rem;">${catName}</h2>
                    <a href="category.html?slug=${cat.slug}" class="btn btn-outline-primary rounded-pill btn-sm">${viewAllText} <i class="bi bi-arrow-left-short"></i></a>
                </div>
                
                <div class="category-carousel">
                    ${cardsHtml}
                </div>
            </div>`;
        });

        container.innerHTML = html;

    } catch (err) {
        console.error("Error loading category sections:", err);
        container.innerHTML = '<div class="alert alert-danger">Error loading products.</div>';
    }
}