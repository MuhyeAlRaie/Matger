/**
 * CHECKOUT.JS
 * Handles Checkout Form, Region Logic, and Order Submission
 */

document.addEventListener('DOMContentLoaded', async () => {
    await loadRegions();
    calculateTotal(); // Initial calc
});

// 1. LOAD REGIONS & POPULATE SELECT
async function loadRegions() {
    const { data, error } = await supabase
        .from('delivery_regions')
        .select('*')
        .eq('is_active', true)
        .order('delivery_price', { ascending: true });

    const select = document.getElementById('delivery-region');
    select.innerHTML = '<option value="" selected disabled>اختر المنطقة...</option>';

    if (data) {
        data.forEach(region => {
            const name = localStorage.getItem('lang') === 'ar' ? region.region_name_ar : region.region_name_en;
            const option = document.createElement('option');
            option.value = JSON.stringify({ id: region.id, price: region.delivery_price, name: name });
            option.textContent = `${name} - ${region.delivery_price} JOD`;
            select.appendChild(option);
        });
    }
}

// 2. LISTEN FOR REGION CHANGE
document.getElementById('delivery-region').addEventListener('change', function(e) {
    calculateTotal();
});

// 3. GEOLOCATION
document.getElementById('detect-location-btn').addEventListener('click', () => {
    const status = document.getElementById('location-status');
    status.textContent = "جاري تحديد الموقع...";

    if (!navigator.geolocation) {
        status.textContent = "المتصفح لا يدعم تحديد الموقع.";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            document.getElementById('lat').value = position.coords.latitude;
            document.getElementById('lng').value = position.coords.longitude;
            status.textContent = "تم تحديد الموقع: " + position.coords.latitude.toFixed(4) + ", " + position.coords.longitude.toFixed(4);
            
            // Optional: Try to guess region based on coords (Complex, skipping for MVP)
            // For now, just alert user to select region manually or keep it as extra data
            alert("تم تحديد موقعك. يرجى اختيار منطقة التوصيل من القائمة لحساب السعر.");
        },
        (error) => {
            status.textContent = "فشل تحديد الموقع: " + error.message;
        }
    );
});

// 4. CALCULATE TOTALS
function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem('ecommerce_cart')) || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Get Delivery Price
    const regionSelect = document.getElementById('delivery-region');
    let deliveryFee = 0;
    let regionName = '';

    if (regionSelect.value) {
        const regionData = JSON.parse(regionSelect.value);
        deliveryFee = parseFloat(regionData.price);
        regionName = regionData.name;
    }

    // Check Coupon (From Cart Logic)
    let discount = 0;
    // Simple coupon re-check (or store applied coupon in localStorage in cart.js)
    // Assuming no coupon for now unless implemented in cart.js and passed here

    const total = subtotal + deliveryFee - discount;

    // Update UI
    document.getElementById('summary-subtotal').textContent = subtotal.toFixed(2) + ' JOD';
    document.getElementById('summary-delivery').textContent = deliveryFee.toFixed(2) + ' JOD';
    document.getElementById('summary-total').textContent = total.toFixed(2) + ' JOD';

    return { subtotal, deliveryFee, total, regionName };
}

// 5. SUBMIT ORDER
document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const cart = JSON.parse(localStorage.getItem('ecommerce_cart')) || [];
    
    if (cart.length === 0) {
        alert("السلة فارغة!");
        return;
    }

    const btn = document.getElementById('place-order-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> جاري الطلب...';

    try {
        const { subtotal, deliveryFee, total, regionName } = calculateTotal();
        
        const orderData = {
            user_id: user ? user.id : null,
            customer_name: document.getElementById('fullName').value,
            customer_email: user ? user.email : null,
            customer_phone: document.getElementById('phone').value,
            shipping_address: document.getElementById('address').value,
            delivery_region: regionName,
            delivery_fee: deliveryFee,
            subtotal: subtotal,
            total_amount: total,
            notes: document.getElementById('orderNotes').value,
            status: 'new'
        };

        // 1. Insert Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Insert Order Items
        const itemsToInsert = cart.map(item => ({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name, // Snapshot
            price: item.price,       // Snapshot
            quantity: item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        // 3. Clear Cart & Redirect
        localStorage.removeItem('ecommerce_cart');
        window.location.href = 'thank-you.html';

    } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء إتمام الطلب: ' + error.message);
        btn.disabled = false;
        btn.innerHTML = 'تأكيد الطلب';
    }
});