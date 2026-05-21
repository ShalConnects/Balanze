import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  lastWishNextCheckInMs,
  lastWishRemainingMs,
  lastWishSidebarBadgeFromRemaining,
} from '../lib/lastWishCheckInCountdown';
import { useAuthStore } from '../store/authStore';

type SidebarCountdown = {
  isActive: boolean;
  label: string | null;
};

export function useLastWishSidebarCountdown(): SidebarCountdown {
  const { user, profile } = useAuthStore();
  const isPremium = profile?.subscription?.plan === 'premium';
  const [nextCheckInMs, setNextCheckInMs] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!user?.id || !isPremium) {
      setNextCheckInMs(null);
      setEnabled(false);
      setDelivered(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from('last_wish_settings')
        .select('is_enabled, check_in_frequency, last_check_in, delivery_triggered')
        .eq('user_id', user.id)
        .single();

      if (cancelled || error || !data?.is_enabled || !data?.check_in_frequency) {
        if (!cancelled) {
          setEnabled(false);
          setDelivered(false);
          setNextCheckInMs(null);
        }
        return;
      }

      const isDelivered = data.delivery_triggered === true;
      const next = lastWishNextCheckInMs(data.last_check_in ?? null, data.check_in_frequency);

      if (!cancelled) {
        setEnabled(true);
        setDelivered(isDelivered);
        setNextCheckInMs(next);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isPremium]);

  useEffect(() => {
    if (!enabled || delivered || !nextCheckInMs) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [enabled, delivered, nextCheckInMs]);

  return useMemo(() => {
    if (!enabled || delivered || !nextCheckInMs) return { isActive: false, label: null };
    const remaining = lastWishRemainingMs(nextCheckInMs, nowMs);
    return { isActive: true, label: lastWishSidebarBadgeFromRemaining(remaining) };
  }, [enabled, delivered, nextCheckInMs, nowMs]);
}

