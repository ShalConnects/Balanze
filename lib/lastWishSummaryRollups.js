/**
 * Aggregate amounts by currency for Last Wish summaries (PDF + email).
 * @returns {{ totals: Record<string, number>, counts: Record<string, number>, count: number }}
 */
export function sumAmountsByCurrency(rows, getAmount, getCurrency = (r) => r?.currency || 'USD') {
  const totals = {};
  const counts = {};
  let count = 0;
  for (const row of rows || []) {
    if (!row) continue;
    count++;
    const cur = getCurrency(row) || 'USD';
    totals[cur] = (totals[cur] || 0) + (Number(getAmount(row)) || 0);
    counts[cur] = (counts[cur] || 0) + 1;
  }
  return { totals, counts, count };
}
