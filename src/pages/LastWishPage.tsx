import { Navigate } from 'react-router-dom';
import { LW } from '../components/Dashboard/LW';
import { useAuthStore } from '../store/authStore';

export function LastWishPage() {
  const isPremium = useAuthStore((s) => s.profile?.subscription?.plan === 'premium');
  if (!isPremium) return <Navigate to="/settings?tab=plans-usage" replace />;
  return <LW />;
}
