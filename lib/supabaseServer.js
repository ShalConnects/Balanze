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
/** Service-role only — never use VITE_* (client-bundled) or anon keys. */
const serviceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (url && !serviceKey && process.env.NODE_ENV === 'production') {
  console.error('[supabaseServer] SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) is not set');
}

export const supabase = url && serviceKey ? createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
}) : null;

export const hasServiceRole = Boolean(url && serviceKey);
