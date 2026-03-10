/**
 * PUSH.JS - Push Notification Subscription Logic
 * Handles User Permission and Subscription to Web Push
 */

// REPLACE THIS WITH YOUR PUBLIC VAPID KEY
// Generate one via: npx web-push generate-vapid-keys
const publicVapidKey = 'BD浆_Your_Public_Vapid_Key_Here_Example_Only_XYZ';

// ==========================================
// SUBSCRIPTION LOGIC
// ==========================================

async function registerAndSubscribe() {
    if (!('serviceWorker' in navigator)) {
        console.error("Service Worker not supported");
        return;
    }

    // 1. Register Service Worker (if not already done in index.html, we ensure it's ready)
    const register = await navigator.serviceWorker.register('/service-worker.js');
    console.log("Service Worker Registered for Push");

    // 2. Check current subscription
    const subscription = await register.pushManager.getSubscription();
    
    if (subscription) {
        console.log("Already subscribed:", subscription);
        return; // Already subscribed
    }

    // 3. Request Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        alert("Permission denied. You will not receive notifications.");
        return;
    }

    // 4. Subscribe
    try {
        const newSubscription = await register.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        console.log("Push Subscribed:", newSubscription);

        // 5. Save to Supabase
        await saveSubscriptionToSupabase(newSubscription);
        
        alert("تم تفعيل الإشعارات بنجاح! / Notifications enabled!");

    } catch (error) {
        console.error("Subscription failed:", error);
    }
}

// ==========================================
// DATABASE STORAGE
// ==========================================

async function saveSubscriptionToSupabase(subscription) {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Prepare the subscription object as JSON
    const subJson = subscription.toJSON();

    const { error } = await supabase
        .from('push_subscriptions') // You need to create this table in Supabase
        .insert([{
            user_id: user ? user.id : null, // null if guest
            endpoint: subJson.endpoint,
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
            created_at: new Date()
        }]);

    if (error) {
        console.error("Error saving subscription to DB:", error);
    } else {
        console.log("Subscription saved to DB");
    }
}

// ==========================================
// UTILS
// ==========================================

// Helper to convert VAPID key (standard Web Push requirement)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Expose function to global scope for button clicks
window.enableNotifications = registerAndSubscribe;