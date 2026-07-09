export const PRIZE_BOND_DENOMINATION = 100;
export const PRIZE_BOND_BATCH_SIZE = 40;
export const PRIZE_BOND_PAGE_SIZE = 150;
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const DRAW_SLOTS = [[1, 31], [4, 30], [7, 31], [10, 31]]; // month, day (Dhaka calendar)

/** Bengali → ASCII digits (PBRIS returns Bengali numerals). */
export function normalizeAsciiDigits(input) {
  return String(input).replace(/[০-৯]/g, (ch) => String(BN_DIGITS.indexOf(ch)));
}

export function parsePbrisDrawDate(raw) {
  const s = normalizeAsciiDigits(raw);
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function dhakaParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
  return {
    year: Number(parts.find((p) => p.type === 'year')?.value),
    month: Number(parts.find((p) => p.type === 'month')?.value),
    day: Number(parts.find((p) => p.type === 'day')?.value),
  };
}

export function isPrizeBondDrawDay(date = new Date()) {
  const { month, day } = dhakaParts(date);
  return DRAW_SLOTS.some(([m, d]) => m === month && d === day);
}

function drawDate(year, slot) {
  const [month, day] = DRAW_SLOTS[slot];
  return new Date(year, month - 1, day);
}

export function getDrawSchedule(reference = new Date()) {
  const { year } = dhakaParts(reference);
  const candidates = [];
  for (const y of [year - 1, year, year + 1]) {
    for (let i = 0; i < DRAW_SLOTS.length; i++) candidates.push(drawDate(y, i));
  }
  candidates.sort((a, b) => a.getTime() - b.getTime());
  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const next = candidates.find((d) => d >= today) ?? candidates[candidates.length - 1];
  const idx = candidates.indexOf(next);
  return { previous: idx > 0 ? candidates[idx - 1] : candidates[0], next };
}
