import { format } from 'date-fns';

function parseUTCDateInput(date: string | Date): Date | null {
  if (!date) return null;
  if (typeof date !== 'string') return isNaN(date.getTime()) ? null : date;
  const hasTimezone = /[+-]\d{2}:\d{2}$/.test(date) || date.endsWith('Z');
  const parsed = new Date(hasTimezone ? date : `${date}Z`);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format time with proper timezone handling
 * Ensures UTC timestamps are correctly converted to local time
 */
export function formatTimeUTC(date: string | Date, formatString: string = 'h:mm a'): string {
  const dateObj = parseUTCDateInput(date);
  if (!dateObj) return 'Invalid time';
  return format(dateObj, formatString);
}

/**
 * Format date with proper timezone handling
 */
export function formatDateUTC(date: string | Date, formatString: string = 'MMM dd, yyyy'): string {
  const dateObj = parseUTCDateInput(date);
  if (!dateObj) return 'Invalid date';
  return format(dateObj, formatString);
}
