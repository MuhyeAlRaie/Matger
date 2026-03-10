
/**
 * Supabase Configuration (Fixed)
 * Prevents "Identifier already declared" errors.
 */

const SUPABASE_URL = 'https://mpkkuhcarwfribnxaqpq.supabase.co'; // REPLACE WITH YOUR URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wa2t1aGNhcndmcmlibnhhcXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODUwMjQsImV4cCI6MjA4ODY2MTAyNH0.HRwGVkaTQ-EM9AEVk8MzOadrt7j1aS8tEwHrwjPM-Iw'; // REPLACE WITH YOUR KEY

// Initialize only once
if (!window.appSupabaseClient) {
    try {
        window.appSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase Client Initialized');
    } catch (error) {
        console.error('Supabase Init Error:', error);
    }
}

// Make it available globally so other scripts can find it
const supabase = window.appSupabaseClient;