/**
 * Checkout Logic
 * Handles:
 * 1. Geolocation Detection & Reverse Geocoding (Address Auto-fill)
 * 2. Saving User Location to Supabase
 * 3. Delivery Region Selection & Shipping Cost Calculation
 * 4. Order Submission (Orders & Order Items)
 */

let cartData = [];
let deliveryRegions = [];
let selectedRegion = null;
let shippingCost = 0;

// ==========================================
// 1. Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    if (!currentUser) {
        showToast(currentLang === 'ar' ? 'يرجى تسجيل الدخول لإتمام الطلب' : 'Please login to complete order', 'danger');
        setTimeout(() => window.location.href = 'login.html', 2000);
        return;
    }

    // Load Cart Data
    loadCartFromStorage();
    if (cartData.length === 0) {
        window.location.href = 'cart.html'; // Redirect if empty
        return;
    }

    // Load Delivery Regions
    await loadDeliveryRegions();

    // Render Order Summary
    renderOrderSummary();

    // Setup Form Listener
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', handlePlaceOrder);
    }

    // Setup Geolocation Listener
    const geoBtn = document.getElementById('detect-location-btn');
    if (geoBtn) {
        geoBtn.addEventListener('click', detectMyLocation);
    }
});

// ==========================================
// 2. Geolocation & Address Logic
// ==========================================
function detectMyLocation() {
    const btn = document.getElementById('detect-location-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>...';

    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', 'danger');
        resetBtn(btn, originalText);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            try {
                // 1. Reverse Geocoding using OpenStreetMap Nominatim API (Free)
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                
                const addressString = data.display_name || `Lat: ${lat}, Lng: ${lng}`;

                // 2. Save to Supabase
                const { error: dbError } = await supabase.from('user_locations').insert([{
                    user_id: currentUser.id,
                    latitude: lat,
                    longitude: lng,
                    address: addressString
                }]);

                if (dbError) console.error("Error saving location:", dbError);

                // 3. Auto-fill Form
                document.getElementById('checkout-address').value = addressString;
                showToast(currentLang === 'ar' ? 'تم تحديد الموقع بنجاح' : 'Location detected successfully', 'success');

            } catch (err) {
                console.error("Geocoding error:", err);
                showToast(currentLang === 'ar' ? 'فشل الحصول على العنوان' : 'Failed to get address', 'danger');
            } finally {
                resetBtn(btn, originalText);
            }
        },
        (error) => {
            console.error("Geo Error:", error);
            showToast(currentLang === 'ar' ? 'فشل الوصول للموقع' : 'Could not get location', 'danger');
            resetBtn(btn, originalText);
        }
    );
}

function resetBtn(btn, text) {
    btn.disabled = false;
    btn.innerHTML = text;
}

// ==========================================
// 3. Delivery Regions Logic
// ==========================================
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

        // Populate Select
        data.forEach(region => {
            const option = document.createElement('option');
            option.value = region.id;
            const name = currentLang === 'ar' ? region.region_name_ar : region.region_name_en;
            option.textContent = `${name} (${region.cost} JOD)`;
            regionSelect.appendChild(option);
        });

        // Set default to first region
        if (data.length > 0) {
            handleRegionChange({ target: { value: data[0].id } });
            regionSelect.value = data[0].id;
        }

        // Listen for changes
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
        renderOrderSummary(); // Update totals
    }
}

// ==========================================
// 4. Order Summary & Calculation
// ==========================================
async function renderOrderSummary() {
    const container = document.getElementById('checkout-summary-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const totalEl = document.getElementById('checkout-total');

    if (!container) return;

    // Fetch products details
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
    subtotalEl.textContent = formatPrice(subtotal);
    shippingEl.textContent = formatPrice(shippingCost);
    totalEl.textContent = formatPrice(subtotal + shippingCost);
}

// ==========================================
// 5. Place Order Logic
// ==========================================
async function handlePlaceOrder(e) {
    e.preventDefault();
    const btn = document.getElementById('place-order-btn');
    const originalText = btn.innerHTML;
    
    // Validate
    const name = document.getElementById('checkout-name').value;
    const phone = document.getElementById('checkout-phone').value;
    const address = document.getElementById('checkout-address').value;

    if (!name || !phone || !address || !selectedRegion) {
        showToast(currentLang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', 'danger');
        return;
    }

    // Disable Button
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

    try {
        // 1. Calculate Final Totals
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

        // 2. Create Order Record
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

        // 3. Create Order Items
        const itemsWithError = orderItemsPayload.map(item => ({
            ...item,
            order_id: orderData.id
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithError);

        if (itemsError) throw itemsError;

        // 4. Clear Cart
        localStorage.removeItem('app_cart');
        cartData = [];

        // 5. Redirect
        window.location.href = `thank-you.html?id=${orderData.id}`;

    } catch (err) {
        console.error("Order Error:", err);
        showToast(currentLang === 'ar' ? 'فشل إتمام الطلب' : 'Failed to place order', 'danger');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}