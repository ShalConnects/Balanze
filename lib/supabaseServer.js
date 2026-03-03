import { createClient } from '@supabase/supabase-js';

// SUPABASE_URL + SUPABASE_SERVICE_KEY required for serverless (VITE_* not available)
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
