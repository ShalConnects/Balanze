/** Islamic (Hijri) calendar helpers. Uses Intl with islamic-umalqura, UTC for consistency. */

function getIslamicMonthNum(): number {
  try {
    const s = new Intl.DateTimeFormat('en-US', {
      calendar: 'islamic-umalqura',
      month: 'numeric',
      timeZone: 'UTC',
    }).format(new Date());
    return parseInt(s, 10) || 0;
  } catch {
    return 0;
  }
}

/** True in Shaʿbān (8) and Ramaḍān (9). Nav and route guard use this. */
export function isZakahVisible(): boolean {
  const m = getIslamicMonthNum();
  return m === 8 || m === 9;
}

/** Date one Islamic (lunar) year ago (~354 days). Used for “held 1 year” zakatable balance. */
export function getDateOneIslamicYearAgo(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 354);
  return d;
}
