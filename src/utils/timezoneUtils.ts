import { format } from 'date-fns';

/**
 * Format time with proper timezone handling
 * Ensures UTC timestamps are correctly converted to local time
 */
export function formatTimeUTC(date: string | Date, formatString: string = 'h:mm a'): string {
  // Handle null, undefined, or empty values
  if (!date) {
    return 'Invalid time';
  }
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Check if the string has proper timezone information
    // Look for timezone patterns: +HH:MM, -HH:MM, or Z at the end
    const hasTimezone = /[+-]\d{2}:\d{2}$/.test(date) || date.endsWith('Z');
    
    if (hasTimezone) {
      // String already has timezone info, use as-is
      dateObj = new Date(date);
    } else {
      // No timezone info, treat as UTC by adding 'Z'
      // This handles database timestamps that are stored as UTC but without timezone info
      dateObj = new Date(date + 'Z');
    }
  } else {
    dateObj = date;
  }
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid time';
  }
  
  return format(dateObj, formatString);
}

/**
 * Format date with proper timezone handling
 */
export function formatDateUTC(date: string | Date, formatString: string = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString);
}
