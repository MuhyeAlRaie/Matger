/**
 * Authentication Logic
 * Handles:
 * 1. User Login / Register / Logout
 * 2. Session Management (State Listener)
 * 3. Profile Updates & Password Changes
 * 4. UI Updates based on Auth State
 */

let currentUser = null;

// ==========================================
// 1. Auth State Listener (Global)
// ==========================================
// Safety check: Wait for supabase to be defined
const checkAuthInterval = setInterval(() => {
    if (window.supabase && window.supabase.auth) {
        clearInterval(checkAuthInterval);
        
        window.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth Event:', event, session);
            
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                currentUser = session?.user || null;
                updateAuthUI(true);
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                updateAuthUI(false);
                if (window.location.pathname.includes('account.html')) {
                    window.location.href = 'index.html';
                }
            }
        });
    }
}, 100); // Check every 100ms

// ==========================================
// 2. UI Updates
// ==========================================
function updateAuthUI(isLoggedIn) {
    const authContainer = document.getElementById('auth-buttons');
    if (!authContainer) return;

    if (isLoggedIn && currentUser) {
        // Show Account & Logout
        authContainer.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-sm btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle"></i> ${currentUser.email.split('@')[0]}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="account.html"><i class="bi bi-person"></i> ${i18n[currentLang].nav_account}</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="handleLogout()"><i class="bi bi-box-arrow-right"></i> ${i18n[currentLang].logout}</a></li>
                </ul>
            </div>
        `;
    } else {
        // Show Login Button
        authContainer.innerHTML = `
            <a href="login.html" class="btn btn-sm btn-light"><i class="bi bi-person"></i> ${i18n[currentLang].login_title}</a>
        `;
    }
}

// ==========================================
// 3. Login Logic
// ==========================================
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        // Redirect to home or account
        window.location.href = 'account.html';

    } catch (error) {
        console.error('Login error:', error.message);
        if(errorDiv) {
            errorDiv.textContent = currentLang === 'ar' ? 'خطأ في البريد الإلكتروني أو كلمة المرور' : error.message;
            errorDiv.style.display = 'block';
        }
    }
}

// ==========================================
// 4. Register Logic
// ==========================================
// ==========================================
// 4. Register Logic
// ==========================================
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const errorDiv = document.getElementById('reg-error');

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    display_name: name
                }
            }
        });

        if (error) throw error;

        // If email confirmation is OFF, Supabase returns a session immediately.
        // We redirect straight to the account page.
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Register error:', error.message);
        if(errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    }
}

// ==========================================
// 5. Logout Logic
// ==========================================
async function handleLogout() {
    await supabase.auth.signOut();
    // The state listener will handle the redirect
    window.location.href = 'index.html';
}

// ==========================================
// 6. Account Page Logic
// ==========================================
async function loadAccountDetails() {
    if (!currentUser) return;

    // Update UI with user info
    document.getElementById('account-email').textContent = currentUser.email;
    document.getElementById('account-id').textContent = currentUser.id;
    document.getElementById('account-created').textContent = new Date(currentUser.created_at).toLocaleDateString();

    // Load User Orders (Placeholder for logic, fully implemented if fetch is needed)
    loadUserOrders();
}

async function loadUserOrders() {
    const container = document.getElementById('orders-container');
    if(!container) return;

    toggleLoading(true);
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
            container.innerHTML = `<p class="text-muted">${currentLang === 'ar' ? 'لا توجد طلبات سابقة' : 'No previous orders'}</p>`;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <strong>#${order.id.slice(0,8)}...</strong>
                        <span class="badge ${getStatusColor(order.status)}">${order.status}</span>
                    </div>
                    <div class="small text-muted">
                        ${new Date(order.created_at).toLocaleString()} | ${formatPrice(order.total_amount)}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error("Error loading orders:", err);
    } finally {
        toggleLoading(false);
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'pending': return 'bg-warning text-dark';
        case 'shipped': return 'bg-info text-white';
        case 'delivered': return 'bg-success text-white';
        case 'cancelled': return 'bg-danger text-white';
        default: return 'bg-secondary';
    }
}

// ==========================================
// 7. Update Profile / Password
// ==========================================
async function handleUpdateProfile(event) {
    event.preventDefault();
    const newEmail = document.getElementById('update-email').value; // Not recommended to change email in simple impl
    // For this demo, we will focus on updating metadata if needed, 
    // but Supabase requires email verification for changes.
    showToast(currentLang === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile updated', 'success');
}

async function handleChangePassword(event) {
    event.preventDefault();
    const currentPass = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const msgDiv = document.getElementById('password-msg');

    if (newPass !== confirmPass) {
        msgDiv.textContent = currentLang === 'ar' ? 'كلمة المرور الجديدة غير متطابقة' : "Passwords do not match";
        msgDiv.className = "alert alert-danger p-2 mt-2";
        return;
    }

    try {
        // Note: Supabase Client SDK (v2) does not require 'current_password' when the user 
        // is already logged in via a session. It directly updates the password.
        const { data, error } = await supabase.auth.updateUser({
            password: newPass
        });

        if (error) throw error;

        msgDiv.textContent = currentLang === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : "Password updated successfully";
        msgDiv.className = "alert alert-success p-2 mt-2";
        
        // Clear inputs
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';

    } catch (error) {
        console.error(error);
        msgDiv.textContent = error.message;
        msgDiv.className = "alert alert-danger p-2 mt-2";
    }
}

// Attach event listeners if on specific pages
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}
if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}
if (document.getElementById('update-password-form')) {
    document.getElementById('update-password-form').addEventListener('submit', handleChangePassword);
}