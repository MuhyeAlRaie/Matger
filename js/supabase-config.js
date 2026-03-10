/**
 * Supabase Configuration
 * 
 * This file initializes the Supabase client connection.
 * It uses the @supabase/supabase-js library loaded via CDN in index.html.
 */

// 1. REPLACE THESE WITH YOUR ACTUAL SUPABASE CREDENTIALS
// You can find these in your Supabase Dashboard -> Settings -> API
const SUPABASE_URL = 'https://mpkkuhcarwfribnxaqpq.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wa2t1aGNhcndmcmlibnhhcXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODUwMjQsImV4cCI6MjA4ODY2MTAyNH0.HRwGVkaTQ-EM9AEVk8MzOadrt7j1aS8tEwHrwjPM-Iw'; // Public Anon Key

// 2. Initialize the Supabase client
// This creates a global 'supabase' object accessible by other JS files.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3. Optional: Log connection status for debugging
console.log('Supabase Client Initialized', supabase);