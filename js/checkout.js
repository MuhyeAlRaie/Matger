/**
 * Checkout - With Coupon Support
 */

(function() {
    if (window.checkoutHasLoaded) return;
    window.checkoutHasLoaded = true;

    console.log("Checkout with Coupon Support Loaded...");

    // State
    let localCartData = [];
    let currentRegions = [];
    let selectedRegion = null;
    let shippingCost = 0;
    let appliedCoupon = null; // Stores the coupon object

    // 2. Load cart from storage
    function getCartItems() {
        const stored = localStorage.getItem('app_cart');
        return stored ? JSON.parse(stored) : [];
    }

    // 3. Helpers
    function getLocalizedField(obj, fieldName) {
        if (!obj) return '';
        const suffix = currentLang === 'ar' ? 'ar' : 'en';
        return obj[`${fieldName}_${suffix}`] || obj[`${fieldName}_ar`] || '';
    }

    function formatPrice(price) {
        if (!price) return '0.00 JOD';
        return parseFloat(price).toFixed(2) + ' ' + (currentLang === 'ar' ? 'د.أ' : 'JOD');
    }

    // 4. Initialization
    document.addEventListener('DOMContentLoaded', async () => {
        if (!window.supabase) {
            console.error("Supabase not ready");
            return;
        }

        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error || !session) {
            console.log("No active session found, redirecting to login.");
            if (window.showToast) showToast(currentLang === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login', 'danger');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        // FIX: Load Coupon from LocalStorage
        const storedCoupon = localStorage.getItem('app_coupon');
        if (storedCoupon) {
            try {
                appliedCoupon = JSON.parse(storedCoupon);
                console.log("Applied Coupon Loaded:", appliedCoupon);
            } catch(e) {
                console.error("Error parsing coupon", e);
            }
        }

        const items = getCartItems();
        if (items.length === 0) {
            window.location.href = 'cart.html';
            return;
        }

        await loadRegions();
        updateSummary(items, session.user);

        const form = document.getElementById('checkout-form');
        if (form) form.addEventListener('submit', (e) => placeOrder(e, session.user));

        const btnLoc = document.getElementById('detect-location-btn');
        if (btnLoc) btnLoc.addEventListener('click', detectLocation);
    });

    // 5. Regions Logic
    async function loadRegions() {
        const select = document.getElementById('delivery-region');
        if (!select) return;

        try {
            const { data, error } = await window.supabase
                .from('delivery_regions')
                .select('*')
                .order('cost', { ascending: true });

            if (error) throw error;
            currentRegions = data;

            select.innerHTML = '';
            data.forEach(region => {
                const opt = document.createElement('option');
                opt.value = region.id;
                const name = currentLang === 'ar' ? region.region_name_ar : region.region_name_en;
                opt.textContent = `${name} (${region.cost} JOD)`;
                select.appendChild(opt);
            });

            if (data.length > 0) {
                handleRegionChange({ target: { value: data[0].id } });
                select.value = data[0].id;
            }

            select.addEventListener('change', handleRegionChange);
        } catch (e) { console.error(e); }
    }

    function handleRegionChange(e) {
        const id = e.target.value;
        selectedRegion = currentRegions.find(r => r.id == id);
        if (selectedRegion) {
            shippingCost = selectedRegion.cost;
            updateSummary(getCartItems(), null);
        }
    }

    // 6. Summary Logic (UPDATED WITH COUPON)
    async function updateSummary(items, user) {
        const container = document.getElementById('checkout-summary-items');
        const subEl = document.getElementById('checkout-subtotal');
        const shipEl = document.getElementById('checkout-shipping');
        const totalEl = document.getElementById('checkout-total');

        if (!container) return;

        const ids = items.map(i => i.id);
        const { data: products } = await window.supabase.from('products').select('*').in('id', ids);

        let subtotal = 0;
        let html = '';

        if (products) {
            products.forEach(prod => {
                const item = items.find(c => c.id === prod.id);
                const qty = item ? item.quantity : 0;
                const price = prod.discount_price || prod.price;
                subtotal += price * qty;

                const name = getLocalizedField(prod, 'name');
                html += `<div class="d-flex justify-content-between mb-2 small"><span>${name} x ${qty}</span><span>${formatPrice(price * qty)}</span></div>`;
            });
        }

        container.innerHTML = html;
        if (subEl) subEl.textContent = formatPrice(subtotal);
        if (shipEl) shipEl.textContent = formatPrice(shippingCost);
        
        // CALCULATE TOTAL WITH COUPON (Updated)
        let discount = 0;
        if (appliedCoupon) {
            if (appliedCoupon.discount_type === 'percentage') {
                discount = subtotal * (appliedCoupon.value / 100);
            } else {
                discount = appliedCoupon.value;
            }
        }
        if (discount > subtotal) discount = subtotal;

        const finalTotal = subtotal + shippingCost - discount;
        if (totalEl) totalEl.textContent = formatPrice(finalTotal);

        // NEW: Update Discount Row Visibility and Text
        const discRow = document.getElementById('checkout-discount-row');
        const discEl = document.getElementById('checkout-discount');
        const typeEl = document.getElementById('coupon-type-display');

        if (discRow && discEl && typeEl) {
            if (appliedCoupon && discount > 0) {
                discRow.classList.remove('d-none'); // Show the row
                
                // Determine text to show (e.g., "10%" or "Fixed")
                let typeText = (appliedCoupon.discount_type === 'percentage') 
                    ? appliedCoupon.value + '%' 
                    : 'Fixed';
                
                typeEl.textContent = typeText;
                discEl.textContent = "-" + formatPrice(discount);
            } else {
                discRow.classList.add('d-none'); // Hide if no coupon
            }
        }
    }

    // 7. Submit Logic (UPDATED WITH COUPON)
    async function placeOrder(e, user) {
        e.preventDefault();
        const btn = document.getElementById('place-order-btn');
        const originalText = btn.innerHTML;

        const name = document.getElementById('checkout-name').value;
        const phone = document.getElementById('checkout-phone').value;
        const address = document.getElementById('checkout-address').value;

        if (!name || !phone || !address || !selectedRegion) {
            if (window.showToast) showToast(currentLang === 'ar' ? 'Fill fields' : 'Fill all fields', 'danger');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '...';

        try {
            const items = getCartItems();
            const ids = items.map(i => i.id);
            const { data: products } = await window.supabase.from('products').select('*').in('id', ids);

            let subtotal = 0;
            const orderItems = [];

            products.forEach(prod => {
                const item = items.find(c => c.id === prod.id);
                const qty = item.quantity;
                const price = prod.discount_price || prod.price;
                subtotal += price * qty;
                orderItems.push({ product_id: prod.id, quantity: qty, unit_price: price });
            });

            // CALCULATE DISCOUNT FOR DATABASE
            let discount = 0;
            if (appliedCoupon) {
                if (appliedCoupon.discount_type === 'percentage') {
                    discount = subtotal * (appliedCoupon.value / 100);
                } else {
                    discount = appliedCoupon.value;
                }
            }
            if (discount > subtotal) discount = subtotal;

            const finalTotal = subtotal + shippingCost - discount;

            const { data: order } = await window.supabase.from('orders').insert([{
                user_id: user.id,
                total_amount: finalTotal,
                shipping_cost: shippingCost,
                status: 'pending',
                customer_name: name,
                customer_phone: phone,
                shipping_address: address,
                region_id: selectedRegion.id
            }]).select().single();

            const itemsWithId = orderItems.map(i => ({ ...i, order_id: order.id }));
            await window.supabase.from('order_items').insert(itemsWithId);

            // CLEAR COUPON AND CART AFTER SUCCESS
            localStorage.removeItem('app_cart');
            localStorage.removeItem('app_coupon'); 
            localCartData = [];
            
            window.location.href = `thank-you.html?id=${order.id}`;
        } catch (err) {
            console.error(err);
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    // 8. Location Logic
    function detectLocation() {
        const btn = document.getElementById('detect-location-btn');
        const old = btn.innerHTML;
        btn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                    const data = await res.json();
                    document.getElementById('checkout-address').value = data.display_name;
                } catch(e) {}
                btn.disabled = false;
                btn.innerHTML = old;
            },
            () => {
                btn.disabled = false;
                btn.innerHTML = old;
            }
        );
    }
})();