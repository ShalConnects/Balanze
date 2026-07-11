import { isCapacitorApp } from './platformDetection';

const NATIVE_API_ORIGIN = (import.meta.env.VITE_APP_URL || 'https://balanze.cash').replace(/\/$/, '');

/** Resolve `/api/...` for web (same-origin) vs native Capacitor (absolute site URL). */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return isCapacitorApp() ? `${NATIVE_API_ORIGIN}${p}` : p;
}
