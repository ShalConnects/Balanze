import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Always merge env files. Do not early-return when only VITE_* is set — that skips SERVICE_KEY. */
function loadEnvFiles() {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(process.cwd(), file);
    if (existsSync(path)) dotenv.config({ path });
  }
}

loadEnvFiles();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
}) : null;
