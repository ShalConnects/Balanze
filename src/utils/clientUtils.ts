/**
 * Client utility functions for ClientList component
 * Contains color mappings and helper functions
 */

import { format, differenceInYears, differenceInMonths, differenceInWeeks, differenceInDays, parseISO } from 'date-fns';

// Invoice status color mappings
export const invoiceStatusColors: Record<string, string> = {
  draft: 'text-gray-600 dark:text-gray-400',
  sent: 'text-blue-600 dark:text-blue-400',
  paid: 'text-green-600 dark:text-green-400',
  overdue: 'text-red-600 dark:text-red-400',
  cancelled: 'text-gray-400 dark:text-gray-500'
};

// Payment status color mappings
export const paymentStatusColors: Record<string, string> = {
  unpaid: 'text-yellow-600 dark:text-yellow-400',
  partial: 'text-orange-600 dark:text-orange-400',
  paid: 'text-green-600 dark:text-green-400'
};

// Task priority color mappings
export const taskPriorityColors: Record<string, string> = {
  low: 'text-gray-600 dark:text-gray-400',
  medium: 'text-blue-600 dark:text-blue-400',
  high: 'text-orange-600 dark:text-orange-400',
  urgent: 'text-red-600 dark:text-red-400'
};

// Task status color mappings
export const taskStatusColors: Record<string, string> = {
  in_progress: 'text-blue-600 dark:text-blue-400',
  waiting_on_client: 'text-yellow-600 dark:text-yellow-400',
  waiting_on_me: 'text-purple-600 dark:text-purple-400',
  completed: 'text-green-600 dark:text-green-400',
  cancelled: 'text-gray-400 dark:text-gray-500'
};

/**
 * Get invoice status color class
 */
export const getInvoiceStatusColor = (status: string): string => {
  return invoiceStatusColors[status] || 'text-gray-600 dark:text-gray-400';
};

/**
 * Get payment status color class
 */
export const getPaymentStatusColor = (status: string): string => {
  return paymentStatusColors[status] || 'text-gray-400';
};

/**
 * Get task priority color class
 */
export const getTaskPriorityColor = (priority: string): string => {
  return taskPriorityColors[priority] || 'text-gray-600 dark:text-gray-400';
};

/**
 * Get task status color class
 */
export const getTaskStatusColor = (status: string): string => {
  return taskStatusColors[status] || 'text-gray-600 dark:text-gray-400';
};

/**
 * Format date as duration with year (e.g., "5 years (since 2023)" or "2 months (since Dec 2023)")
 */
export const formatKnownSinceDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const years = differenceInYears(now, date);
    const months = differenceInMonths(now, date);
    const weeks = differenceInWeeks(now, date);
    const days = differenceInDays(now, date);
    
    // Format the "since" part based on how long ago
    let sincePart: string;
    if (years >= 1) {
      // For 1+ years, show just the year
      sincePart = format(date, 'yyyy');
    } else if (months >= 1) {
      // For 1+ months, show month and year
      sincePart = format(date, 'MMM yyyy');
    } else {
      // For less than a month, show full date
      sincePart = format(date, 'MMM d, yyyy');
    }
    
    // Format the duration part
    let durationPart: string;
    if (years >= 1) {
      durationPart = years === 1 ? '1 year' : `${years} years`;
    } else if (months >= 1) {
      durationPart = months === 1 ? '1 month' : `${months} months`;
    } else if (weeks >= 1) {
      durationPart = weeks === 1 ? '1 week' : `${weeks} weeks`;
    } else if (days >= 1) {
      durationPart = days === 1 ? '1 day' : `${days} days`;
    } else {
      // Less than a day - just show the date
      return `Since ${sincePart}`;
    }
    
    return `${durationPart} (since ${sincePart})`;
  } catch (error) {
    return '';
  }
};

