/**
 * SUPABASE-CONFIG.JS
 * Initializes the Supabase Client
 */

import { createClient } from 'https://unpkg.com/@supabase/supabase-js@2';

// REPLACE THESE WITH YOUR KEYS
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);