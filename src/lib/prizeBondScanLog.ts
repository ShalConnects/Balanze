/** Dev-only prize bond logs (browser console). */
export function logPrizeBond(scope: string, ...args: unknown[]): void {
  if (import.meta.env.DEV) console.log(`[PrizeBond:${scope}]`, ...args);
}

export function logBondScan(...args: unknown[]): void {
  logPrizeBond('scan', ...args);
}
