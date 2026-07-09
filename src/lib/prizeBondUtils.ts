const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const BN_CONSONANT = '[\u0995-\u09B9\u09DC\u09DD]';
const SERIES_RE = [
  new RegExp(`${BN_CONSONANT}\\s*${BN_CONSONANT}\\s*([০-৯0-9\\s.\\-]{7,12})`, 'g'),
  new RegExp(`${BN_CONSONANT}{2}[\u0980-\u09FF]*?([০-৯0-9]{7,12})`, 'g'),
];

import {
  PRIZE_BOND_DENOMINATION,
  PRIZE_BOND_BATCH_SIZE,
  PRIZE_BOND_PAGE_SIZE,
  getDrawSchedule,
  isPrizeBondDrawDay,
} from '../../lib/prizeBondShared.js';

export {
  PRIZE_BOND_DENOMINATION,
  PRIZE_BOND_BATCH_SIZE,
  PRIZE_BOND_PAGE_SIZE,
  getDrawSchedule,
  isPrizeBondDrawDay,
};

export function normalizeBondDigits(input: string): string {
  return input
    .replace(/[০-৯]/g, (ch) => String(BN_DIGITS.indexOf(ch)))
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/\D/g, '');
}

function takeSevenDigits(raw: string): string | null {
  const d = normalizeBondDigits(raw);
  if (d.length === 7) return d;
  if (d.length === 8) {
    for (let i = 0; i < 8; i++) {
      const c = d.slice(0, i) + d.slice(i + 1);
      if (c.length === 7) return c;
    }
  }
  return d.length > 7 ? d.slice(0, 7) : null;
}

export function normalizeBondNumber(input: string): string | null {
  return takeSevenDigits(input.trim());
}

/** Bulk paste / manual import — plain 7-digit numbers. */
export function parseBondNumbersFromText(text: string): string[] {
  const ascii = text.replace(/[০-৯]/g, (ch) => String(BN_DIGITS.indexOf(ch)));
  const found = new Set<string>();
  for (const m of ascii.matchAll(/\d{7}/g)) found.add(m[0]);
  for (const part of ascii.split(/[\s,;|\n]+/)) {
    const n = normalizeBondNumber(part);
    if (n) found.add(n);
  }
  return [...found];
}

function matchScore(full: string, digitPart: string): number {
  let s = 1;
  if (/[০-৯]{7}/.test(full)) s += 3;
  const digitIdx = full.search(/[০-৯0-9]/);
  if (digitIdx >= 0) s += Math.max(0, 4 - Math.max(0, digitIdx - 2));
  if (normalizeBondDigits(digitPart).length === 7) s += 2;
  return s;
}

function boostNineOverOne(scores: Map<string, number>): void {
  const keys = [...scores.keys()];
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i];
      const b = keys[j];
      const idx = [...a].findIndex((c, k) => c !== b[k]);
      if (idx < 0 || [...a].filter((c, k) => c !== b[k]).length !== 1) continue;
      if ((a[idx] === '1' && b[idx] === '9') || (a[idx] === '9' && b[idx] === '1')) {
        scores.set(a[idx] === '9' ? a : b, (scores.get(a[idx] === '9' ? a : b) ?? 0) + 4);
      }
    }
  }
}

/** OCR — number must follow two Bengali consonant series letters (e.g. খ শ ০১৩৯২৩৭). */
export function scoreSeriesOcrMatches(text: string): Map<string, number> {
  const ascii = text.replace(/[০-৯]/g, (ch) => String(BN_DIGITS.indexOf(ch)));
  const scores = new Map<string, number>();

  for (const re of SERIES_RE) {
    re.lastIndex = 0;
    for (const m of ascii.matchAll(re)) {
      const n = takeSevenDigits(m[1]);
      if (!n) continue;
      const s = matchScore(m[0], m[1]);
      scores.set(n, (scores.get(n) ?? 0) + s);
    }
  }
  boostNineOverOne(scores);
  return scores;
}

export function parseBondNumbersFromSeriesOcr(text: string): string[] {
  return [...scoreSeriesOcrMatches(text).entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([n]) => n);
}

export function formatBondListForPbris(numbers: string[]): string {
  return numbers.join(',');
}

export function winningBondIdSet(wins: { bond_id: string }[]): Set<string> {
  return new Set(wins.map((w) => w.bond_id));
}

export type PrizeBondDashboardSummary = {
  bondCount: number;
  faceValue: number;
  winCount: number;
  nextDraw: Date;
  previousDraw: Date;
};

export function summarizePrizeBonds(
  bonds: { denomination?: number }[],
  wins: unknown[],
): PrizeBondDashboardSummary {
  const schedule = getDrawSchedule();
  return {
    bondCount: bonds.length,
    faceValue: bonds.length * PRIZE_BOND_DENOMINATION,
    winCount: wins.length,
    nextDraw: schedule.next,
    previousDraw: schedule.previous,
  };
}
