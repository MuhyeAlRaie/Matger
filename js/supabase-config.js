

/**
 * Supabase Configuration (CRITICAL FIX)
 * MUST assign to window.supabase so other scripts can see it.
 */

const SUPABASE_URL = 'https://mpkkuhcarwfribnxaqpq.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wa2t1aGNhcndmcmlibnhhcXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODUwMjQsImV4cCI6MjA4ODY2MTAyNH0.HRwGVkaTQ-EM9AEVk8MzOadrt7j1aS8tEwHrwjPM-Iw'; 

// Initialize only once
if (!window.appSupabaseClient) {
    window.appSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase Client Initialized Successfully');
} else {
    console.log('♻️ Supabase Client already exists, reusing...');
}

// ASSIGN TO WINDOW GLOBAL so app.js, auth.js, etc. can find it!
window.supabase = window.appSupabaseClient;