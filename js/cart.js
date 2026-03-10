/**
 * Shopping Cart Logic (Fixed with Safety Checks)
 * Handles:
 * 1. LocalStorage persistence
 * 2. Add/Remove/Update items
 * 3. Calculate totals and apply coupons
 * 4. Render Cart UI on cart.html
 */

const CART_KEY = 'app_cart';
let cartData = [];
let appliedCoupon = null;

// ==========================================
// 1. Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    updateCartCountUI();

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

function addToCart(productId) {
    const existingItem = cartData.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartData.push({ id: productId, quantity: 1 });
    }
    saveCartToStorage();
    const msg = currentLang === 'ar' ? 'تمت الإضافة للسلة' : 'Added to cart';
    showToast(msg, 'success');
}

function removeFromCart(productId) {
    cartData = cartData.filter(item => item.id !== productId);
    saveCartToStorage();
    renderCartPage();
}

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

function updateCartCountUI() {
    const badge = document.getElementById('cart-count');
    if (badge) {
        const totalCount = cartData.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = totalCount;
        badge.style.display = totalCount > 0 ? 'block' : 'none';
    }
}

// ==========================================
// 3. Cart Page Rendering (Fixed Crashes)
// ==========================================
async function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    const summaryContainer = document.getElementById('cart-summary');
    const emptyMsg = document.getElementById('empty-cart-msg');

    // SAFETY CHECK: If on a page without these elements, stop.
    if (!container) return;

    toggleLoading(true);

    if (cartData.length === 0) {
        container.innerHTML = '';
        
        // FIX: Check if summaryContainer exists before styling it
        if (summaryContainer) summaryContainer.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'block';
        
        toggleLoading(false);
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';
    if (summaryContainer) summaryContainer.style.display = 'block';

    try {
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
            const price = product.discount_price || product.price;
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
    const msgEl = document.getElementById('coupon-message');
    const code = codeInput.value.trim().toUpperCase();

    if (!code) return;

    try {
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
        
        // Need to recalculate totals
        // Since we don't have the subtotal variable here easily, we trigger a re-render
        renderCartPage();

    } catch (err) {
        console.error(err);
    }
}

function updateCartSummary(subtotal) {
    let discount = 0;
    const summaryBody = document.getElementById('summary-body');
    const checkoutBtnTotal = document.getElementById('checkout-total');

    if (!summaryBody) return;

    if (appliedCoupon) {
        if (appliedCoupon.discount_type === 'percentage') {
            discount = subtotal * (appliedCoupon.value / 100);
        } else {
            discount = appliedCoupon.value;
        }
    }

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

    summaryBody.innerHTML = html;
}