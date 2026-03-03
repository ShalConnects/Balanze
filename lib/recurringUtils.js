/** Shared recurring transaction utilities (API + frontend) */

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
    default: return date.toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
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
