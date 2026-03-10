/**
 * Checkout Logic (Safe & Self-Contained)
 * Handles:
 * 1. Geolocation
 * 2. Delivery Regions
 * 3. Order Submission
 */

// SAFETY WRAPPER: Prevents crash if script is loaded twice
(function() {
    if (window.checkoutInitialized) return;
    window.checkoutInitialized = true;

    // State
    let cartData = [];
    let deliveryRegions = [];
    let selectedRegion = null;
    let shippingCost = 0;

    // Helpers (Included here to ensure they exist)
    function getLocalizedField(obj, fieldName) {
        if (!obj) return '';
        const suffix = currentLang === 'ar' ? 'ar' : 'en';
        return obj[`${fieldName}_${suffix}`] || obj[`${fieldName}_ar`] || '';
    }

    function formatPrice(price) {
        if (!price) return '0.00 JOD';
        return parseFloat(price).toFixed(2) + ' ' + (currentLang === 'ar' ? 'د.أ' : 'JOD');
    }

    // Initialization
    document.addEventListener('DOMContentLoaded', async () => {
        // Security Check
        if (!currentUser) {
            showToast(currentLang === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login', 'danger');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        loadCartFromStorage();
        if (cartData.length === 0) {
            window.location.href = 'cart.html';
            return;
        }

        await loadDeliveryRegions();
        renderOrderSummary();

        const form = document.getElementById('checkout-form');
        if (form) form.addEventListener('submit', handlePlaceOrder);

        const geoBtn = document.getElementById('detect-location-btn');
        if (geoBtn) geoBtn.addEventListener('click', detectMyLocation);
    });

    // Geolocation
    function detectMyLocation() {
        const btn = document.getElementById('detect-location-btn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>...';

        if (!navigator.geolocation) {
            showToast('Geolocation not supported', 'danger');
            resetBtn(btn, originalText);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await response.json();
                    const addressString = data.display_name || `Lat: ${lat}, Lng: ${lng}`;

                    await supabase.from('user_locations').insert([{
                        user_id: currentUser.id,
                        latitude: lat,
                        longitude: lng,
                        address: addressString
                    }]);

                    document.getElementById('checkout-address').value = addressString;
                    showToast(currentLang === 'ar' ? 'تم تحديد الموقع' : 'Location detected', 'success');

                } catch (err) {
                    console.error(err);
                    showToast(currentLang === 'ar' ? 'فشل الحصول على العنوان' : 'Failed to get address', 'danger');
                } finally {
                    resetBtn(btn, originalText);
                }
            },
            (error) => {
                console.error(error);
                showToast(currentLang === 'ar' ? 'فشل الوصول للموقع' : 'Could not get location', 'danger');
                resetBtn(btn, originalText);
            }
        );
    }

    function resetBtn(btn, text) {
        btn.disabled = false;
        btn.innerHTML = text;
    }

    // Regions
    async function loadDeliveryRegions() {
        const regionSelect = document.getElementById('delivery-region');
        if (!regionSelect) return;

        try {
            const { data, error } = await supabase
                .from('delivery_regions')
                .select('*')
                .order('cost', { ascending: true });

            if (error) throw error;
            deliveryRegions = data;

            regionSelect.innerHTML = '';
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
        selectedRegion = deliveryRegions.find(r => r.id == regionId);
        if (selectedRegion) {
            shippingCost = selectedRegion.cost;
            renderOrderSummary();
        }
    }

    // Summary
    async function renderOrderSummary() {
        const container = document.getElementById('checkout-summary-items');
        const subtotalEl = document.getElementById('checkout-subtotal');
        const shippingEl = document.getElementById('checkout-shipping');
        const totalEl = document.getElementById('checkout-total');

        if (!container) return;

        const ids = cartData.map(item => item.id);
        const { data: products } = await supabase.from('products').select('*').in('id', ids);

        let subtotal = 0;
        let html = '';

        if (products) {
            products.forEach(prod => {
                const cartItem = cartData.find(c => c.id === prod.id);
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

    // Submit Order
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
            const ids = cartData.map(item => item.id);
            const { data: products } = await supabase.from('products').select('*').in('id', ids);

            let subtotal = 0;
            const orderItemsPayload = [];

            products.forEach(prod => {
                const cartItem = cartData.find(c => c.id === prod.id);
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

            const { data: orderData, error: orderError } = await supabase
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

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(itemsWithError);

            if (itemsError) throw itemsError;

            localStorage.removeItem('app_cart');
            cartData = [];

            window.location.href = `thank-you.html?id=${orderData.id}`;

        } catch (err) {
            console.error("Order Error:", err);
            showToast(currentLang === 'ar' ? 'فشل الطلب' : 'Failed', 'danger');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
})();