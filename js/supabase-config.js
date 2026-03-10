/**
 * SUPABASE-CONFIG.JS
 * Initializes the Supabase Client
 */

import { createClient } from 'https://unpkg.com/@supabase/supabase-js@2';

// REPLACE THESE WITH YOUR KEYS
const SUPABASE_URL = 'https://mpkkuhcarwfribnxaqpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wa2t1aGNhcndmcmlibnhhcXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODUwMjQsImV4cCI6MjA4ODY2MTAyNH0.HRwGVkaTQ-EM9AEVk8MzOadrt7j1aS8tEwHrwjPM-Iw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);