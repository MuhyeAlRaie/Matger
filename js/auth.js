/**
 * AUTH.JS - Authentication Logic
 * Handles User Registration, Login, and Session Management via Supabase
 */

// ==========================================
// INITIALIZATION & EVENT LISTENERS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Handle Registration Form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // 2. Handle Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 3. Check current session on load
    checkSession();
});

// ==========================================
// AUTH STATE LISTENER
// ==========================================
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user);
        localStorage.setItem('user', JSON.stringify(session.user));
        updateUIForAuth(true);
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        localStorage.removeItem('user');
        updateUIForAuth(false);
        
        // If on protected pages, redirect to home
        if (window.location.pathname.includes('admin/')) {
            window.location.href = '../index.html';
        }
    }
});

async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        localStorage.setItem('user', JSON.stringify(session.user));
        updateUIForAuth(true);
    } else {
        updateUIForAuth(false);
    }
}

function updateUIForAuth(isLoggedIn) {
    // This helper is mainly for pages that might need immediate UI updates
    // The heavy lifting is done in app.js for the Navbar
}

// ==========================================
// REGISTRATION LOGIC
// ==========================================
async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // UI Feedback
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    // You could set a default role here, but usually managed in DB or dashboard
                }
            }
        });

        if (error) throw error;

        // Success
        showAuthMessage('success', 'Registration successful! Please check your email to verify your account, or log in if auto-confirmed.');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        showAuthMessage('danger', error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ==========================================
// LOGIN LOGIC
// ==========================================
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // UI Feedback
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        // Check if user should go to Admin (Simple check based on email domain for demo)
        // In production, check user_role from 'profiles' table or custom claims
        if (email.includes('admin')) {
             window.location.href = 'admin/index.html';
        } else {
             window.location.href = 'index.html';
        }

    } catch (error) {
        showAuthMessage('danger', 'Login failed: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ==========================================
// GLOBAL LOGOUT
// ==========================================
window.handleLogout = async function() {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle local storage cleanup
    window.location.href = 'index.html';
}

// ==========================================
// HELPER: SHOW ALERT MESSAGE
// ==========================================
function showAuthMessage(type, message) {
    const alertBox = document.getElementById('auth-alert');
    if (alertBox) {
        alertBox.className = `alert alert-${type} mt-3`;
        alertBox.textContent = message;
        alertBox.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    } else {
        // Fallback if alert box not in HTML
        alert(message);
    }
}