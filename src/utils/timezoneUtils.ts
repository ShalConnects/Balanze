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

function parseAppDateInput(date: string | Date): Date | null {
  if (!date) return null;
  if (typeof date !== 'string') return isNaN(date.getTime()) ? null : date;

  // Keep business dates local to match transaction add/edit flow (yyyy-MM-dd).
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const localDate = new Date(`${date}T00:00:00`);
    return isNaN(localDate.getTime()) ? null : localDate;
  }

  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatAppDate(date: string | Date): string {
  const dateObj = parseAppDateInput(date);
  if (!dateObj) return 'Invalid date';
  return format(dateObj, 'MMM dd, yyyy');
}

export function formatAppMonthDay(date: string | Date): string {
  const dateObj = parseAppDateInput(date);
  if (!dateObj) return 'Invalid date';
  return format(dateObj, 'MMM dd');
}

export function formatAppMonthShort(date: string | Date): string {
  const dateObj = parseAppDateInput(date);
  if (!dateObj) return 'Invalid date';
  return format(dateObj, 'MMM');
}

export function formatAppMonthLong(date: string | Date): string {
  const dateObj = parseAppDateInput(date);
  if (!dateObj) return 'Invalid date';
  return format(dateObj, 'MMMM');
}

export function formatAppTime(date: string | Date): string {
  const dateObj = parseAppDateInput(date);
  if (!dateObj) return 'Invalid time';
  return format(dateObj, 'h:mm a');
}

export function formatAppDateTime(date: string | Date): string {
  const dateObj = parseAppDateInput(date);
  if (!dateObj) return 'Invalid date';
  return format(dateObj, 'MMM dd, yyyy h:mm a');
}

export function formatAppExportDateTime(date: string | Date = new Date()): string {
  const dateObj = parseAppDateInput(date);
  if (!dateObj) return 'Invalid date';
  return format(dateObj, 'yyyy-MM-dd HH:mm:ss');
}
