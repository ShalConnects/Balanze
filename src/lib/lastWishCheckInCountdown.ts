/** One check-in period in ms (frequency is stored in whole days). */
export const LAST_WISH_CHECKIN_DAY_MS = 24 * 60 * 60 * 1000;
export const LAST_WISH_CHECKIN_HOUR_MS = 60 * 60 * 1000;

export type LastWishUrgency = 'safe' | 'warning' | 'critical' | 'overdue';

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

/** True when deadline is in the future and within the last 24h. */
export function lastWishIsFinalDayWindow(remainingMs: number): boolean {
  return remainingMs > 0 && remainingMs <= LAST_WISH_CHECKIN_DAY_MS;
}

/** True when deadline is in the future and within the last 1h. */
export function lastWishIsFinalHourWindow(remainingMs: number): boolean {
  return remainingMs > 0 && remainingMs <= LAST_WISH_CHECKIN_HOUR_MS;
}

export function lastWishProgressPercentage(
  remainingMs: number,
  checkInFrequencyDays: number
): number {
  const totalDuration = checkInFrequencyDays * LAST_WISH_CHECKIN_DAY_MS;
  if (totalDuration <= 0) return 0;
  return Math.max(
    0,
    Math.min(100, ((totalDuration - Math.max(0, remainingMs)) / totalDuration) * 100)
  );
}

export function lastWishUrgencyLevel(remainingMs: number): LastWishUrgency {
  if (remainingMs < 0) return 'overdue';
  if (lastWishIsFinalDayWindow(remainingMs)) return 'critical';
  const ceilDays = Math.ceil(remainingMs / LAST_WISH_CHECKIN_DAY_MS);
  if (ceilDays <= 3) return 'critical';
  if (ceilDays <= 7) return 'warning';
  return 'safe';
}

export function lastWishStatusChip(
  remainingMs: number,
  urgency: LastWishUrgency
): { label: string; className: string } {
  if (remainingMs < 0) {
    return { label: 'OVERDUE', className: 'bg-red-500 text-white animate-pulse' };
  }
  if (lastWishIsFinalHourWindow(remainingMs)) {
    return { label: 'FINAL HOUR', className: 'bg-red-500 text-white animate-pulse' };
  }
  if (lastWishIsFinalDayWindow(remainingMs)) {
    return { label: 'FINAL DAY', className: 'bg-orange-500 text-white animate-pulse' };
  }
  if (urgency === 'critical') {
    return { label: 'URGENT', className: 'bg-orange-500 text-white animate-pulse' };
  }
  if (urgency === 'warning') {
    return { label: 'SOON', className: 'bg-yellow-400/90 text-yellow-950' };
  }
  return { label: 'SAFE', className: 'bg-green-500/15 text-green-700 dark:text-green-300' };
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

/** Snapshot fields shared by initial fetch + 1s ticker (presentation math only). */
export function lastWishCountdownSnapshot(
  remainingMs: number,
  checkInFrequencyDays: number,
  nextCheckInLabel: string
) {
  const urgencyLevel = lastWishUrgencyLevel(remainingMs);
  return {
    daysLeft: Math.max(0, Math.ceil(remainingMs / LAST_WISH_CHECKIN_DAY_MS)),
    nextCheckIn: nextCheckInLabel,
    isOverdue: remainingMs < 0,
    urgencyLevel,
    progressPercentage: lastWishProgressPercentage(remainingMs, checkInFrequencyDays),
    isFinalDay: lastWishIsFinalDayWindow(remainingMs),
    isFinalHour: lastWishIsFinalHourWindow(remainingMs),
    timeLeft: lastWishDisplayHms(remainingMs) ?? undefined,
    remainingMs,
  };
}

/** Sidebar pill: full days as `Nd`, last day as `1d`, past deadline unchanged. */
export function lastWishSidebarBadgeFromRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00:00';
  if (remainingMs >= LAST_WISH_CHECKIN_DAY_MS) {
    return `${Math.ceil(remainingMs / LAST_WISH_CHECKIN_DAY_MS)}d`;
  }
  return '1d';
}
