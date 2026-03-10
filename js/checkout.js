/**
 * Checkout Logic (Ultimate Fix)
 * Variables renamed to prevent conflicts.
 */

(function() {
    // Prevent running twice
    if (window.checkoutHasRun) return;
    window.checkoutHasRun = true;

    // 1. Variables (Renamed to avoid conflict)
    let localCartData = [];
    let localRegions = [];
    let selectedRegion = null;
    let shippingCost = 0;

    // 2. Helpers
    function getLocalizedField(obj, fieldName) {
        if (!obj) return '';
        const suffix = currentLang === 'ar' ? 'ar' : 'en';
        return obj[`${fieldName}_${suffix}`] || obj[`${fieldName}_ar`] || '';
    }

    function formatPrice(price) {
        if (!price) return '0.00 JOD';
        return parseFloat(price).toFixed(2) + ' ' + (currentLang === 'ar' ? 'د.أ' : 'JOD');
    }

    // 3. Initialization
    document.addEventListener('DOMContentLoaded', async () => {
        console.log("Checkout Page Initializing...");

        // Wait for Supabase to be ready (Safety check)
        if (!window.supabase) {
            console.error("Supabase not loaded yet.");
            return;
        }

        if (!currentUser) {
            showToast(currentLang === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login', 'danger');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        // Load Cart Data
        const stored = localStorage.getItem('app_cart');
        if (stored) {
            localCartData = JSON.parse(stored);
        }

        if (localCartData.length === 0) {
            window.location.href = 'cart.html';
            return;
        }

        console.log("Cart loaded, fetching regions...");
        await loadDeliveryRegions();
        await renderOrderSummary();

        // Events
        const form = document.getElementById('checkout-form');
        if (form) form.addEventListener('submit', handlePlaceOrder);

        const geoBtn = document.getElementById('detect-location-btn');
        if (geoBtn) geoBtn.addEventListener('click', detectMyLocation);
    });

    // 4. Functions
    async function loadDeliveryRegions() {
        const regionSelect = document.getElementById('delivery-region');
        if (!regionSelect) return;

        try {
            const { data, error } = await window.supabase
                .from('delivery_regions')
                .select('*')
                .order('cost', { ascending: true });

            if (error) throw error;
            localRegions = data;

            regionSelect.innerHTML = '<option value="" selected disabled>Loading regions...</option>';
            
            data.forEach(region => {
                const option = document.createElement('option');
                option.value = region.id;
                const name = currentLang === 'ar' ? region.region_name_ar : region.region_name_en;
                option.textContent = `${name} (${region.cost} JOD)`;
                regionSelect.appendChild(option);
            });

            if (data.length > 0) {
                handleRegionChange({ target: { value: data[0].id } });
                regionSelect.value = data[0].id;
            }

            regionSelect.addEventListener('change', handleRegionChange);

        } catch (err) {
            console.error("Error loading regions:", err);
        }
    }

    function handleRegionChange(e) {
        const regionId = e.target.value;
        selectedRegion = localRegions.find(r => r.id == regionId);
        if (selectedRegion) {
            shippingCost = selectedRegion.cost;
            renderOrderSummary();
        }
    }

    async function renderOrderSummary() {
        console.log("Rendering Order Summary...");
        const container = document.getElementById('checkout-summary-items');
        const subtotalEl = document.getElementById('checkout-subtotal');
        const shippingEl = document.getElementById('checkout-shipping');
        const totalEl = document.getElementById('checkout-total');

        if (!container) {
            console.error("Summary container missing!");
            return;
        }

        const ids = localCartData.map(item => item.id);
        const { data: products } = await window.supabase.from('products').select('*').in('id', ids);

        let subtotal = 0;
        let html = '';

        if (products) {
            products.forEach(prod => {
                const cartItem = localCartData.find(c => c.id === prod.id);
                const qty = cartItem ? cartItem.quantity : 0;
                const price = prod.discount_price || prod.price;
                subtotal += price * qty;

                const name = getLocalizedField(prod, 'name');
                html += `
                    <div class="d-flex justify-content-between mb-2 small">
                        <span>${name} x ${qty}</span>
                        <span>${formatPrice(price * qty)}</span>
                    </div>
                `;
            });
        }

        container.innerHTML = html;
        if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
        if (shippingEl) shippingEl.textContent = formatPrice(shippingCost);
        if (totalEl) totalEl.textContent = formatPrice(subtotal + shippingCost);
    }

    async function handlePlaceOrder(e) {
        e.preventDefault();
        const btn = document.getElementById('place-order-btn');
        const originalText = btn.innerHTML;

        const name = document.getElementById('checkout-name').value;
        const phone = document.getElementById('checkout-phone').value;
        const address = document.getElementById('checkout-address').value;

        if (!name || !phone || !address || !selectedRegion) {
            showToast(currentLang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Fill all fields', 'danger');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

        try {
            const ids = localCartData.map(item => item.id);
            const { data: products } = await window.supabase.from('products').select('*').in('id', ids);

            let subtotal = 0;
            const orderItemsPayload = [];

            products.forEach(prod => {
                const cartItem = localCartData.find(c => c.id === prod.id);
                const qty = cartItem.quantity;
                const price = prod.discount_price || prod.price;
                subtotal += price * qty;

                orderItemsPayload.push({
                    product_id: prod.id,
                    quantity: qty,
                    unit_price: price
                });
            });

            const finalTotal = subtotal + shippingCost;

            const { data: orderData, error: orderError } = await window.supabase
                .from('orders')
                .insert([{
                    user_id: currentUser.id,
                    total_amount: finalTotal,
                    shipping_cost: shippingCost,
                    status: 'pending',
                    customer_name: name,
                    customer_phone: phone,
                    shipping_address: address,
                    region_id: selectedRegion.id
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            const itemsWithError = orderItemsPayload.map(item => ({
                ...item,
                order_id: orderData.id
            }));

            const { error: itemsError } = await window.supabase
                .from('order_items')
                .insert(itemsWithError);

            if (itemsError) throw itemsError;

            localStorage.removeItem('app_cart');
            localCartData = [];

            window.location.href = `thank-you.html?id=${orderData.id}`;

        } catch (err) {
            console.error("Order Error:", err);
            showToast(currentLang === 'ar' ? 'فشل الطلب' : 'Failed', 'danger');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
    
    // Geolocation (Simplified)
    function detectMyLocation() {
        const btn = document.getElementById('detect-location-btn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '...';

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await res.json();
                    document.getElementById('checkout-address').value = data.display_name || `${lat},${lng}`;
                    showToast("Location found", "success");
                } catch(e) { console.error(e); }
                finally { 
                    btn.disabled = false; 
                    btn.innerHTML = originalText; 
                }
            },
            (err) => { 
                console.error(err); 
                btn.disabled = false; 
                btn.innerHTML = originalText; 
            }
        );
    }
})();