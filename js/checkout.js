/**
 * Checkout - Final Fix (Uses Direct Session Check)
 */

(function() {
    // Prevent running twice
    if (window.checkoutHasLoaded) return;
    window.checkoutHasLoaded = true;

    console.log("Checkout Safe Version Loaded...");

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

    // 4. Initialization (FIXED: Uses getSession)
    document.addEventListener('DOMContentLoaded', async () => {
        // Wait for supabase
        if (!window.supabase) {
            console.error("Supabase not ready");
            return;
        }

        // FIX: Check Session Directly from Database
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error || !session) {
            console.log("No active session found, redirecting to login.");
            if (window.showToast) showToast(currentLang === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login', 'danger');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        // Check if cart has items
        const items = getCartItems();
        if (items.length === 0) {
            window.location.href = 'cart.html';
            return;
        }

        // Load UI
        await loadRegions();
        updateSummary(items, session.user); // Pass user to summary if needed

        // Listeners
        const form = document.getElementById('checkout-form');
        if (form) form.addEventListener('submit', (e) => placeOrder(e, session.user)); // Pass user to order function

        const btnLoc = document.getElementById('detect-location-btn');
        if (btnLoc) btnLoc.addEventListener('click', detectLocation);
    });

    // 5. Regions Logic
    let currentRegions = [];
    let selectedRegion = null;
    let shippingCost = 0;

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
            updateSummary(getCartItems(), null); // Refresh summary with new cost
        }
    }

    // 6. Summary Logic
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
        if (totalEl) totalEl.textContent = formatPrice(subtotal + shippingCost);
    }

    // 7. Submit Logic (FIXED: Receives User)
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

            // FIX: Use the passed 'user' object
            const { data: order } = await window.supabase.from('orders').insert([{
                user_id: user.id,
                total_amount: subtotal + shippingCost,
                shipping_cost: shippingCost,
                status: 'pending',
                customer_name: name,
                customer_phone: phone,
                shipping_address: address,
                region_id: selectedRegion.id
            }]).select().single();

            const itemsWithId = orderItems.map(i => ({ ...i, order_id: order.id }));
            await window.supabase.from('order_items').insert(itemsWithId);

            localStorage.removeItem('app_cart');
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