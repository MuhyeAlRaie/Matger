/**
 * Shopping Cart Logic
 * Handles:
 * 1. LocalStorage persistence
 * 2. Add/Remove/Update items
 * 3. Calculate totals and apply coupons
 * 4. Render Cart UI on cart.html
 */

const CART_KEY = 'app_cart';
let cartData = [];
let appliedCoupon = null; // Stores coupon object { code, discount_type, value }

// ==========================================
// 1. Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    updateCartCountUI();

    // If we are on the Cart page, render the full table
    if (window.location.pathname.includes('cart.html')) {
        renderCartPage();
    }
});

// ==========================================
// 2. Core Cart Functions
// ==========================================
function loadCartFromStorage() {
    const stored = localStorage.getItem(CART_KEY);
    cartData = stored ? JSON.parse(stored) : [];
}

function saveCartToStorage() {
    localStorage.setItem(CART_KEY, JSON.stringify(cartData));
    updateCartCountUI();
}

function getCart() {
    return cartData;
}

// Add item to cart
function addToCart(productId) {
    const existingItem = cartData.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartData.push({ id: productId, quantity: 1 });
    }
    
    saveCartToStorage();
    
    // Show feedback
    const msg = currentLang === 'ar' ? 'تمت الإضافة للسلة' : 'Added to cart';
    showToast(msg, 'success');
}

// Remove item completely
function removeFromCart(productId) {
    cartData = cartData.filter(item => item.id !== productId);
    saveCartToStorage();
    renderCartPage(); // Re-render if on cart page
}

// Update quantity (+1 or -1)
function updateQuantity(productId, change) {
    const item = cartData.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCartToStorage();
        renderCartPage();
    }
}

// Update Navbar Badge
function updateCartCountUI() {
    const badge = document.getElementById('cart-count');
    if (badge) {
        const totalCount = cartData.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = totalCount;
        badge.style.display = totalCount > 0 ? 'block' : 'none';
    }
}

// ==========================================
// 3. Cart Page Rendering
// ==========================================
async function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    const summaryContainer = document.getElementById('cart-summary');
    const emptyMsg = document.getElementById('empty-cart-msg');

    if (!container) return;

    toggleLoading(true);

    if (cartData.length === 0) {
        container.innerHTML = '';
        summaryContainer.style.display = 'none';
        if(emptyMsg) emptyMsg.style.display = 'block';
        toggleLoading(false);
        return;
    }

    if(emptyMsg) emptyMsg.style.display = 'none';
    summaryContainer.style.display = 'block';

    try {
        // Fetch product details for all items in cart
        const ids = cartData.map(item => item.id);
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .in('id', ids);

        if (error) throw error;

        if (!products || products.length === 0) {
            container.innerHTML = '<div class="alert alert-warning">Products not found.</div>';
            toggleLoading(false);
            return;
        }

        let html = '';
        let subtotal = 0;

        products.forEach(product => {
            const cartItem = cartData.find(c => c.id === product.id);
            const qty = cartItem ? cartItem.quantity : 0;
            
            // Price logic
            const price = product.discount_price && product.discount_price < product.price ? product.discount_price : product.price;
            const itemTotal = price * qty;
            subtotal += itemTotal;

            const name = getLocalizedField(product, 'name');
            const imgUrl = product.image_url || 'https://via.placeholder.com/80';

            html += `
                <div class="card mb-3 border-0 shadow-sm">
                    <div class="card-body p-3">
                        <div class="row align-items-center">
                            <div class="col-3 col-md-2">
                                <img src="${imgUrl}" class="img-fluid rounded cart-item-img" alt="${name}">
                            </div>
                            <div class="col-9 col-md-5">
                                <h5 class="mb-1 product-title"><a href="product.html?slug=${product.slug}" class="text-decoration-none text-dark">${name}</a></h5>
                                <div class="text-muted small">${formatPrice(price)}</div>
                            </div>
                            <div class="col-12 col-md-3 mt-3 mt-md-0">
                                <div class="quantity-control d-inline-flex">
                                    <button class="quantity-btn" onclick="updateQuantity(${product.id}, -1)">-</button>
                                    <span class="px-2">${qty}</span>
                                    <button class="quantity-btn" onclick="updateQuantity(${product.id}, 1)">+</button>
                                </div>
                            </div>
                            <div class="col-6 col-md-2 text-end mt-2 mt-md-0">
                                <div class="fw-bold">${formatPrice(itemTotal)}</div>
                                <button class="btn btn-sm text-danger p-0 mt-1" onclick="removeFromCart(${product.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        updateCartSummary(subtotal);

    } catch (err) {
        console.error("Error rendering cart:", err);
        container.innerHTML = '<div class="alert alert-danger">Error loading cart items.</div>';
    } finally {
        toggleLoading(false);
    }
}

// ==========================================
// 4. Coupon & Totals Logic
// ==========================================
async function applyCoupon() {
    const codeInput = document.getElementById('coupon-code');
    const code = codeInput.value.trim().toUpperCase();
    const msgEl = document.getElementById('coupon-message');

    if (!code) return;

    try {
        // Check coupon in Supabase
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();

        if (error || !coupon) {
            appliedCoupon = null;
            if(msgEl) {
                msgEl.textContent = currentLang === 'ar' ? 'كوبون غير صالح' : 'Invalid coupon code';
                msgEl.className = 'form-text text-danger';
            }
            return;
        }

        appliedCoupon = coupon;
        if(msgEl) {
            msgEl.textContent = currentLang === 'ar' ? 'تم تطبيق الكوبون بنجاح' : 'Coupon applied successfully';
            msgEl.className = 'form-text text-success';
        }

        // Re-render summary to show discount
        const subtotal = calculateCurrentSubtotal(); // Helper to recalculate from DOM or state
        updateCartSummary(subtotal);

    } catch (err) {
        console.error(err);
    }
}

function updateCartSummary(subtotal) {
    let discount = 0;
    const summaryBody = document.getElementById('summary-body');
    const checkoutBtnTotal = document.getElementById('checkout-total');

    if (appliedCoupon) {
        if (appliedCoupon.discount_type === 'percentage') {
            discount = subtotal * (appliedCoupon.value / 100);
        } else {
            discount = appliedCoupon.value;
        }
    }

    // Ensure discount doesn't exceed subtotal
    if (discount > subtotal) discount = subtotal;

    const total = subtotal - discount;

    const html = `
        <div class="d-flex justify-content-between mb-2">
            <span class="text-muted">${i18n[currentLang].price} (${i18n[currentLang].subtotal})</span>
            <span>${formatPrice(subtotal)}</span>
        </div>
        ${appliedCoupon ? `
        <div class="d-flex justify-content-between mb-2 text-success">
            <span>${currentLang === 'ar' ? 'الخصم' : 'Discount'} (${appliedCoupon.code})</span>
            <span>-${formatPrice(discount)}</span>
        </div>` : ''}
        <hr>
        <div class="d-flex justify-content-between mb-3">
            <span class="fw-bold fs-5">${currentLang === 'ar' ? 'الإجمالي' : 'Total'}</span>
            <span class="fw-bold fs-5 text-primary">${formatPrice(total)}</span>
        </div>
        <a href="checkout.html" class="btn btn-primary w-100 py-2">${currentLang === 'ar' ? 'إتمام الشراء' : 'Proceed to Checkout'}</a>
    `;

    if (summaryBody) summaryBody.innerHTML = html;
}

// Helper to recalculate subtotal from the currently fetched products (used in coupon apply)
// In a real app we might store subtotal in a variable, but recalculating is safer.
function calculateCurrentSubtotal() {
    // This is a bit tricky because we don't have the product prices here easily without re-fetching or storing them.
    // For simplicity in this step, we will trigger a full re-render of the cart which recalculates everything.
    renderCartPage();
    return 0; // Placeholder, renderCartPage handles the UI update.
}