import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

type SidebarCountdown = {
  isActive: boolean;
  label: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

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
      const base = data.last_check_in ? new Date(data.last_check_in).getTime() : Date.now();
      const next = base + data.check_in_frequency * DAY_MS;

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
    const remaining = nextCheckInMs - nowMs;
    if (remaining <= 0) return { isActive: true, label: '00:00:00' };

    if (remaining >= DAY_MS) {
      return { isActive: true, label: `${Math.ceil(remaining / DAY_MS)}d` };
    }

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    const pad = (v: number) => String(v).padStart(2, '0');
    return { isActive: true, label: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` };
  }, [enabled, delivered, nextCheckInMs, nowMs]);
}

