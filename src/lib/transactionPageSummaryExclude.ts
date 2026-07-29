/** Local-only eye-toggle excludes for /transactions page summary cards (not synced to server). */

const storageKey = (userId: string) => `tx-page-summary-exclude:${userId}`;

export function readPageSummaryExcludeIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export function togglePageSummaryExcludeId(userId: string, transactionId: string, current: Set<string>): Set<string> {
  const next = new Set(current);
  if (next.has(transactionId)) next.delete(transactionId);
  else next.add(transactionId);
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify([...next]));
  } catch {
    /* ignore quota / private mode */
  }
  return next;
}
