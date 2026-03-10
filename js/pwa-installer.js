/**
 * PWA-INSTALLER.JS
 * Handles the PWA Install Prompt
 */

let deferredPrompt;
const installBtn = document.getElementById('pwa-install-btn');
const installContainer = document.getElementById('pwa-install-container');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    if (installContainer) installContainer.classList.remove('d-none');
});

if (installBtn) {
    installBtn.addEventListener('click', (e) => {
        // Show the prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                } else {
                    console.log('User dismissed the A2HS prompt');
                }
                deferredPrompt = null;
            });
        } else {
            // Fallback for iOS or if prompt not available
            alert("To install: Tap Share button > Add to Home Screen");
        }
    });
}

// Detect iOS to show button permanently (since beforeinstallprompt doesn't work well on iOS)
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS && installContainer) {
    installContainer.classList.remove('d-none');
    if(installBtn) installBtn.onclick = () => alert("To install: Tap Share > Add to Home Screen");
}