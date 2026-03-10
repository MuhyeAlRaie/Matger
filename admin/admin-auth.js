/**
 * ADMIN-AUTH.JS
 * Simple Auth Guard for Admin Pages
 */

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        alert('يجب تسجيل الدخول للوصول للوحة التحكم');
        window.location.href = '../login.html';
        return;
    }

    // Optional: Check if user is admin (usually based on email or role column in profiles)
    // For this MVP, we assume any logged-in user can access, 
    // or you can add: if (!user.email.includes('admin')) { logout... }
    
    // Logout Handler
    window.handleLogout = async function() {
        await supabase.auth.signOut();
        localStorage.removeItem('user');
        window.location.href = '../index.html';
    }
    
    // Set Username in Sidebar
    const nameEl = document.getElementById('admin-username');
    if(nameEl) nameEl.textContent = user.email;
});