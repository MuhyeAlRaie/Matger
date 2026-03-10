/**
 * SUPABASE-CONFIG.JS
 * Initializes the Supabase Client
 */

import { createClient } from 'https://unpkg.com/@supabase/supabase-js@2';

// REPLACE THESE WITH YOUR KEYS
const SUPABASE_URL = 'https://mpkkuhcarwfribnxaqpq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2fC7OROwMaR8V71RlF4RKw_llNdpbAl';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);