import { createClient } from '@supabase/supabase-js';
import { supabase as serviceSupabase } from './supabaseServer.js';

/**
 * Verify Bearer JWT from Authorization header and return the authenticated user.
 * Uses anon key + getUser(token) so the JWT is validated by Supabase Auth.
 * @returns {{ user: object, error?: never } | { user: null, error: string, status: number }}
 */
export async function requireAuthUser(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!token) {
    return { user: null, error: 'Missing authorization token', status: 401 };
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { user: null, error: 'Server configuration error', status: 503 };
  }

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: 'Invalid or expired token', status: 401 };
  }

  return { user: data.user };
}

/**
 * Require auth and optionally ensure body/query userId matches the JWT subject.
 */
export async function requireAuthUserMatchingId(req, claimedUserId) {
  const result = await requireAuthUser(req);
  if (!result.user) return result;

  if (claimedUserId && claimedUserId !== result.user.id) {
    return { user: null, error: 'Forbidden', status: 403 };
  }

  return result;
}

export { serviceSupabase };
