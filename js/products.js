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