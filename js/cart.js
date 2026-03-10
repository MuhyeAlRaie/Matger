/**
 * CART.JS - Shopping Cart Logic
 * Manages cart state in LocalStorage and updates UI
 */

const CART_STORAGE_KEY = 'ecommerce_cart';
const CURRENCY = 'JOD';

// Global Cart State
let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
let appliedCoupon = null; // Stores { code: 'SAVE10', discount: 10, type: 'percent' }

// ==========================================
// CORE FUNCTIONS
// ==========================================

/**
 * Add a product to the cart
 * @param {Object} product - Product object {id, name, price, image, slug}
 */
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
        showToast(`تم تحديث الكمية لـ ${getProductName(product)}`, 'info');
    } else {
        cart.push({ ...product, quantity: 1 });
        showToast(`تمت إضافة ${getProductName(product)} للسلة`, 'success');
    }

    saveCart();
}

/**
 * Remove item completely from cart
 * @param {Number} productId 
 */
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    if (document.getElementById('cart-page-body')) {
        renderCartPage(); // Re-render if on cart page
    }
}

/**
 * Update item quantity
 * @param {Number} productId 
 * @param {Number} change (+1 or -1)
 */
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        if (document.getElementById('cart-page-body')) {
            renderCartPage();
        }
    }
}

/**
 * Save cart to LocalStorage and update Navbar Count
 */
function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
}

/**
 * Calculate total price of items in cart
 * @returns {Number} Subtotal
 */
function getCartSubtotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Apply a coupon code (Logic placeholder - connects to checkout.js later)
 * @param {String} code 
 */
function applyCoupon(code) {
    // In a real app, this would validate against Supabase
    // For now, we simulate a coupon logic
    if (code.toUpperCase() === 'WELCOME10') {
        appliedCoupon = { code: code, discount: 0.10, type: 'percent' };
        showToast('تم تطبيق كوبون الخصم بنجاح 10%', 'success');
        renderCartPage();
    } else {
        showToast('كوبون غير صالح', 'danger');
        appliedCoupon = null;
        renderCartPage();
    }
}

// ==========================================
// UI HELPERS
// ==========================================

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        countEl.textContent = totalItems;
        // Hide badge if 0
        countEl.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2) + ' ' + CURRENCY;
}

// Helper to get name based on current lang (since we store the object snapshot)
function getProductName(product) {
    // If the stored object has language fields, use them, else fallback to name
    const lang = localStorage.getItem('lang') || 'ar';
    if (lang === 'en' && product.name_en) return product.name_en;
    if (lang === 'ar' && product.name_ar) return product.name_ar;
    return product.name || 'منتج';
}

function showToast(message, type = 'info') {
    // Check if toast container exists
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
    }

    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    // Create temp element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = toastHtml;
    const toastEl = temp.firstElementChild;
    
    container.appendChild(toastEl);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toastEl.remove();
    }, 3000);
}

// ==========================================
// RENDER CART PAGE (For cart.html)
// ==========================================
function renderCartPage() {
    const tbody = document.getElementById('cart-page-body');
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountEl = document.getElementById('cart-discount');
    const totalEl = document.getElementById('cart-total');
    const emptyMsg = document.getElementById('cart-empty-msg');

    if (!tbody) return; // Not on cart page

    tbody.innerHTML = '';
    
    if (cart.length === 0) {
        if(emptyMsg) emptyMsg.style.display = 'block';
        subtotalEl.textContent = '0.00 ' + CURRENCY;
        totalEl.textContent = '0.00 ' + CURRENCY;
        return;
    }

    if(emptyMsg) emptyMsg.style.display = 'none';

    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        const name = getProductName(item);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.main_image_url || item.image}" alt="${name}" style="width: 50px; height: 50px; object-fit: cover;" class="me-2 rounded">
                    <div>
                        <h6 class="mb-0">${name}</h6>
                        <small class="text-muted">${formatCurrency(item.price)}</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="input-group input-group-sm" style="width: 100px;">
                    <button class="btn btn-outline-secondary" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <input type="text" class="form-control text-center" value="${item.quantity}" readonly>
                    <button class="btn btn-outline-secondary" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </td>
            <td class="fw-bold">${formatCurrency(itemTotal)}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Calculate Totals with Coupon
    let discountAmount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percent') {
            discountAmount = subtotal * appliedCoupon.discount;
        }
    }

    const finalTotal = subtotal - discountAmount;

    // Update DOM
    if(subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if(discountEl) discountEl.textContent = '-' + formatCurrency(discountAmount);
    if(totalEl) totalEl.textContent = formatCurrency(finalTotal);
}

// Initialize Cart Count on Load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
    // If we are on cart page, render the items
    if (document.getElementById('cart-page-body')) {
        renderCartPage();
        
        // Bind Coupon Button
        const couponBtn = document.getElementById('apply-coupon-btn');
        if(couponBtn) {
            couponBtn.addEventListener('click', () => {
                const input = document.getElementById('coupon-input');
                if(input && input.value) {
                    applyCoupon(input.value);
                }
            });
        }
    }
});