import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { MainLayout } from './Layout/MainLayout';
import { HelpLayout } from './Layout/HelpLayout';

type Layout = 'main' | 'help' | 'bare';

interface ProtectedRouteProps {
  children: React.ReactNode;
  layout?: Layout;
}

export function ProtectedRoute({ children, layout = 'main' }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (layout === 'help') return <HelpLayout>{children}</HelpLayout>;
  if (layout === 'main') return <MainLayout>{children}</MainLayout>;
  return <>{children}</>;
}
