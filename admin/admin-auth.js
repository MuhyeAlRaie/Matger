/**
 * Admin Authentication Guard
 * 
 * This script must be included in every admin HTML page.
 * It checks:
 * 1. Is the user logged in? (Supabase Session)
 * 2. Is the user an admin? (Exists in 'admins' table)
 * 
 * If checks fail, redirect to main login.
 */

async function checkAdminAccess() {
    // 1. Check Session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // Not logged in
        window.location.href = '../login.html';
        return;
    }

    const userEmail = session.user.email;

    // 2. Check Admin Role in Database
    try {
        const { data: adminRecord, error } = await supabase
            .from('admins')
            .select('email')
            .eq('email', userEmail)
            .single();

        if (error || !adminRecord) {
            console.error('Admin check failed:', error);
            alert('Access Denied: You are not authorized to view this page.');
            window.location.href = '../index.html';
            return;
        }

        // Success: User is Admin
        console.log('Admin verified:', userEmail);
        
        // Populate sidebar user info
        const adminNameEl = document.getElementById('admin-user-email');
        if (adminNameEl) adminNameEl.textContent = userEmail;

    } catch (err) {
        console.error('Error checking admin status:', err);
        window.location.href = '../index.html';
    }
}

// Run check when DOM is ready
document.addEventListener('DOMContentLoaded', checkAdminAccess);