import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ProtectedRoute } from './ProtectedRoute';

type Layout = 'main' | 'help' | 'bare';

interface AdminRouteProps {
  children: React.ReactNode;
  layout?: Layout;
}

/**
 * Admin access: profile.role === 'admin', or email listed in VITE_ADMIN_EMAILS
 * (comma-separated). Dev bypass requires explicit VITE_ALLOW_DEV_ADMIN=true.
 */
export function isAdminUser(
  email: string | undefined | null,
  role: string | undefined | null
): boolean {
  if (role === 'admin') return true;

  const allowlist = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  if (email && allowlist.includes(email.toLowerCase())) return true;

  if (import.meta.env.DEV && import.meta.env.VITE_ALLOW_DEV_ADMIN === 'true') {
    return true;
  }

  return false;
}

export function AdminRoute({ children, layout = 'bare' }: AdminRouteProps) {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  if (!user) return <Navigate to="/login" replace />;

  const role = (profile as { role?: string } | null)?.role;
  if (!isAdminUser(user.email, role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <ProtectedRoute layout={layout}>{children}</ProtectedRoute>;
}
