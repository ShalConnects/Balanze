/** One check-in period in ms (frequency is stored in whole days). */
export const LAST_WISH_CHECKIN_DAY_MS = 24 * 60 * 60 * 1000;

export function lastWishNextCheckInMs(
  lastCheckInIso: string | null,
  checkInFrequencyDays: number,
  baseIfNoCheckInMs?: number
): number {
  const base = lastCheckInIso
    ? new Date(lastCheckInIso).getTime()
    : (baseIfNoCheckInMs ?? Date.now());
  return base + checkInFrequencyDays * LAST_WISH_CHECKIN_DAY_MS;
}

export function lastWishRemainingMs(nextCheckInMs: number, nowMs: number): number {
  return nextCheckInMs - nowMs;
}

/** True when deadline is in the future and within the last 24h (same as previous isFinalHour). */
export function lastWishIsFinalDayWindow(remainingMs: number): boolean {
  return remainingMs > 0 && remainingMs <= LAST_WISH_CHECKIN_DAY_MS;
}

/** HMS for the live widget timer; only for (0, 24h]. */
export function lastWishHmsFromRemaining(remainingMs: number): {
  hours: number;
  minutes: number;
  seconds: number;
} | null {
  if (!lastWishIsFinalDayWindow(remainingMs)) return null;
  const totalSeconds = Math.floor(remainingMs / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/** Final-day countdown or overdue elapsed (absolute), for one widget clock. */
export function lastWishDisplayHms(remainingMs: number): {
  hours: number;
  minutes: number;
  seconds: number;
} | null {
  if (remainingMs > 0 && remainingMs <= LAST_WISH_CHECKIN_DAY_MS) {
    return lastWishHmsFromRemaining(remainingMs);
  }
  if (remainingMs < 0) {
    const t = Math.floor(Math.abs(remainingMs) / 1000);
    return {
      hours: Math.floor(t / 3600),
      minutes: Math.floor((t % 3600) / 60),
      seconds: t % 60,
    };
  }
  return null;
}

/** Sidebar pill: full days as `Nd`, last day as `1d`, past deadline unchanged. */
export function lastWishSidebarBadgeFromRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00:00';
  if (remainingMs >= LAST_WISH_CHECKIN_DAY_MS) {
    return `${Math.ceil(remainingMs / LAST_WISH_CHECKIN_DAY_MS)}d`;
  }
  return '1d';
}
