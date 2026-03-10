/**
 * Admin Authentication Guard
 */

async function checkAdminAccess() {
    // 1. Check Session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        console.log('Admin Check: No session found.');
        window.location.href = '../login.html';
        return;
    }

    const userEmail = session.user.email;
    console.log('Admin Check: Checking email...', userEmail);

    // 2. Check Admin Role in Database
    try {
        const { data: adminRecord, error } = await supabase
            .from('admins')
            .select('email')
            .eq('email', userEmail)
            .single();

        if (error) {
            console.error('Admin Check DB Error:', error);
            alert(`Database Error: ${error.message}`);
            window.location.href = '../index.html';
            return;
        }

        if (!adminRecord) {
            console.warn('Admin Check: Email not found in admins table.');
            alert('Access Denied: Your email is not in the admin list.');
            window.location.href = '../index.html';
            return;
        }

        // Success
        console.log('Admin Check: Verified!', userEmail);
        
        // Populate sidebar
        const adminNameEl = document.getElementById('admin-user-email');
        if (adminNameEl) adminNameEl.textContent = userEmail;

    } catch (err) {
        console.error('Admin Check System Error:', err);
        window.location.href = '../index.html';
    }
}

document.addEventListener('DOMContentLoaded', checkAdminAccess);