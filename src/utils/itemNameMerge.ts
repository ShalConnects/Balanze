/** Levenshtein distance for short item names (typo merge). */
export function nameEditDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

const MAX_MERGE_DISTANCE = 2;

export function isLikelySameItem(a: string, b: string): boolean {
  if (a === b) return true;
  const short = a.length <= b.length ? a : b;
  const long = a.length > b.length ? a : b;
  if (short.length >= 4 && long !== short && (long.endsWith(` ${short}`) || long.startsWith(`${short} `))) return true;
  if (Math.abs(a.length - b.length) > MAX_MERGE_DISTANCE) return false;
  return nameEditDistance(a, b) <= MAX_MERGE_DISTANCE;
}
