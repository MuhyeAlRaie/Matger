/**
 * PWA Installer Logic
 * Handles:
 * 1. Detecting 'beforeinstallprompt' event (Chrome/Android)
 * 2. Triggering the native install prompt
 * 3. Providing instructions for iOS (Safari)
 * 4. Hiding the button if already installed
 */

let deferredPrompt; // Stores the event
const installBtn = document.getElementById('pwa-install-btn');

// ==========================================
// 1. Event Listeners
// ==========================================
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    
    // Update UI to notify the user they can add to home screen
    showInstallButton();
});

window.addEventListener('appinstalled', () => {
    // Log app installation
    console.log('PWA was installed');
    // Clear the deferredPrompt
    deferredPrompt = null;
    // Hide the install button
    hideInstallButton();
});

// ==========================================
// 2. Initialization & UI Logic
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Check if app is already running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

    if (isStandalone) {
        hideInstallButton();
        return;
    }

    // Check for iOS specifically
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        // On iOS, we show the button manually because 'beforeinstallprompt' doesn't fire
        showInstallButton();
        // Change text to reflect manual action
        const span = installBtn.querySelector('span');
        if(span) span.textContent = currentLang === 'ar' ? 'أضف للشاشة الرئيسية' : 'Add to Home Screen';
    }
});

function showInstallButton() {
    if (installBtn) {
        installBtn.classList.remove('d-none');
        installBtn.addEventListener('click', handleInstallClick);
    }
}

function hideInstallButton() {
    if (installBtn) {
        installBtn.classList.add('d-none');
        installBtn.removeEventListener('click', handleInstallClick);
    }
}

// ==========================================
// 3. Installation Handler
// ==========================================
async function handleInstallClick() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        // Show instructions for iOS
        showIOSInstructions();
        return;
    }

    // Handle Chrome/Android/Desktop
    if (!deferredPrompt) {
        console.log('Install prompt not available yet');
        return;
    }

    // Show the prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt = null;
    
    if (outcome === 'accepted') {
        hideInstallButton();
    }
}

// ==========================================
// 4. iOS Instructions (Modal/Toast)
// ==========================================
function showIOSInstructions() {
    const msg = currentLang === 'ar' 
        ? 'للإضافة للشاشة الرئيسية: اضغط على زر المشاركة <i class="bi bi-share-fill"></i> ثم "Add to Home Screen".'
        : 'To install: Tap the Share button <i class="bi bi-share-fill"></i> then "Add to Home Screen".';

    // Create a temporary modal for instructions
    const modalHtml = `
        <div class="modal fade" id="iosInstallModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${currentLang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <i class="bi bi-phone display-4 text-primary mb-3"></i>
                        <p>${msg}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">${currentLang === 'ar' ? 'حسناً' : 'OK'}</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Append to body and show
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper);
    
    const modalEl = document.getElementById('iosInstallModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // Cleanup after hide
    modalEl.addEventListener('hidden.bs.modal', () => {
        wrapper.remove();
    });
}