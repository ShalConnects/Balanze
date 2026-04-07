/** Shared recurring transaction utilities (API + frontend) */

function toYyyyMmDd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateNextOccurrence(currentDate, frequency) {
  const date = new Date(currentDate);
  const originalDay = date.getDate();
  switch (frequency) {
    case 'daily': date.setDate(date.getDate() + 1); break;
    case 'weekly': date.setDate(date.getDate() + 7); break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      if (date.getDate() !== originalDay) date.setDate(0);
      break;
    case 'yearly':
      const originalMonth = date.getMonth();
      date.setFullYear(date.getFullYear() + 1);
      if (originalMonth === 1 && originalDay === 29 && date.getMonth() === 2) date.setDate(0);
      break;
    default: return toYyyyMmDd(date);
  }
  return toYyyyMmDd(date);
}

export function getUpcomingOccurrences(startDate, frequency, endDate = null, count = 5) {
  const results = [];
  let d = startDate;
  const end = endDate ? new Date(endDate) : null;
  for (let i = 0; i < count; i++) {
    if (end && new Date(d) > end) break;
    results.push(d);
    d = calculateNextOccurrence(d, frequency);
  }
  return results;
}
