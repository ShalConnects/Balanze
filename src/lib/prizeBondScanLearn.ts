import type { PrizeBondScanFeedback, ScanLearnHints } from '../types/prizeBond';

const REGIONS = ['full', 'series-mid', 'series-bottom'] as const;

export function buildScanLearnHints(rows: PrizeBondScanFeedback[]): ScanLearnHints {
  const regionWins = Object.fromEntries(REGIONS.map((r) => [r, 0])) as Record<string, number>;
  const corrections = new Map<string, string>();

  for (const r of rows) {
    if (r.detected_number !== r.confirmed_number) corrections.set(r.detected_number, r.confirmed_number);
    else if (r.best_region) regionWins[r.best_region] = (regionWins[r.best_region] ?? 0) + 1;
  }

  const total = Object.values(regionWins).reduce((a, b) => a + b, 0) || 1;
  const regionBoost = Object.fromEntries(
    REGIONS.map((r) => [r, 0.85 + 0.3 * ((regionWins[r] ?? 0) / total)]),
  );

  return { regionBoost, corrections };
}

export function applyScanLearnHints(
  merged: Map<string, number>,
  regionByNumber: Map<string, string>,
  hints?: ScanLearnHints,
): void {
  if (!hints) return;
  for (const [num, score] of merged) {
    const region = regionByNumber.get(num);
    if (region) merged.set(num, score * (hints.regionBoost[region] ?? 1));
  }
  const top = [...merged.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (top && hints.corrections.has(top)) {
    const fixed = hints.corrections.get(top)!;
    merged.set(fixed, (merged.get(fixed) ?? 0) + 12);
  }
  for (const [from, to] of hints.corrections) {
    if (merged.has(from) && from !== to) merged.set(to, (merged.get(to) ?? 0) + 6);
  }
}
