/**
 * Push Notification Receiver
 * Listens to Supabase Realtime Broadcasts and triggers UI/OS Notifications.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Request Notification Permission (Only if not granted/denied yet)
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notification permission granted.");
                new Notification("MyStore", {
                    body: "You will now receive updates!",
                    icon: "/images/icons/icon-192x192.png"
                });
            }
        });
    }

    // 2. Subscribe to Realtime Channel
    const channel = supabase.channel('global-notifications')
        .on('broadcast', { event: 'new-push' }, (payload) => {
            console.log('Push received:', payload);
            const { title, body, link } = payload.payload;
            
            // A. Show In-App Toast (Using app.js showToast if available, or standard alert)
            showToast(`🔔 ${title}: ${body}`, 'info');

            // B. Show Native Browser Notification (Works even if tab is in background)
            if ("Notification" in window && Notification.permission === "granted") {
                const notif = new Notification(title, {
                    body: body,
                    icon: "/images/icons/icon-192x192.png",
                    badge: "/images/icons/icon-192x192.png"
                });

                // Redirect on click
                notif.onclick = function(event) {
                    event.preventDefault(); // prevent the browser from focusing the Notification's tab
                    window.open(link, '_blank');
                    notif.close();
                };
            }
        })
        .subscribe((status) => {
            console.log('Push Notification Status:', status);
        });
});