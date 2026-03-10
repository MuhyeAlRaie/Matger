

/**
 * SUPABASE-CONFIG.JS
 */

// 1. Get the library from the window (loaded via CDN in index.html)
const { createClient } = window.supabase;

// 2. REPLACE WITH YOUR ACTUAL KEYS
const SUPABASE_URL = 'https://mpkkuhcarwfribnxaqpq.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wa2t1aGNhcndmcmlibnhhcXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODUwMjQsImV4cCI6MjA4ODY2MTAyNH0.HRwGVkaTQ-EM9AEVk8MzOadrt7j1aS8tEwHrwjPM-Iw';

// 3. Initialize
const _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 4. Make it available globally for other files
window.supabase = _client;