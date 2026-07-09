import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function ensureEnv() {
  const hasUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const hasKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  if (hasUrl && hasKey) return;
  for (const file of ['.env.local', '.env']) {
    const path = resolve(process.cwd(), file);
    if (existsSync(path)) {
      dotenv.config({ path });
      return;
    }
  }
}

ensureEnv();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
