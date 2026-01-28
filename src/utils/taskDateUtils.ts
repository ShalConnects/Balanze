/**
 * Utility functions for task date calculations
 * Normalizes dates to start of day to avoid timezone issues
 */

/**
 * Parses a date string as a local date (not UTC) to prevent timezone offset issues
 * This is the recommended way to parse date-only strings for date pickers
 * @param dateString - Date string in ISO format (YYYY-MM-DD)
 * @returns Date object normalized to local timezone, or null if invalid
 */
export function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const datePart = dateString.split('T')[0]; // Get YYYY-MM-DD part
  const [year, month, day] = datePart.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day); // month is 0-indexed in Date constructor
}

/**
 * Normalizes a date string to a Date object at the start of the day
 * @param dateStr - Date string in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
 * @returns Date object normalized to start of day
 */
export function normalizeTaskDate(dateStr: string): Date {
  const datePart = dateStr.split('T')[0]; // Get YYYY-MM-DD part
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Gets today's date normalized to start of day
 * @returns Date object for today at start of day
 */
export function getTodayNormalized(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Checks if a task is overdue based on its due date
 * @param dueDate - Due date string (ISO format)
 * @param status - Task status (completed tasks are never overdue)
 * @returns true if the task is overdue
 */
export function isTaskOverdue(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate || status === 'completed') {
    return false;
  }
  const today = getTodayNormalized();
  const due = normalizeTaskDate(dueDate);
  return due < today;
}

/**
 * Checks if a task is due today
 * @param dueDate - Due date string (ISO format)
 * @param status - Task status (completed tasks are not due)
 * @returns true if the task is due today
 */
export function isTaskDueToday(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate || status === 'completed') {
    return false;
  }
  const today = getTodayNormalized();
  const due = normalizeTaskDate(dueDate);
  return due.getTime() === today.getTime();
}

/**
 * Checks if a task is due within the next week
 * @param dueDate - Due date string (ISO format)
 * @param status - Task status (completed tasks are not due)
 * @returns true if the task is due within the next week
 */
export function isTaskDueThisWeek(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate || status === 'completed') {
    return false;
  }
  const today = getTodayNormalized();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const due = normalizeTaskDate(dueDate);
  return due >= tomorrow && due <= nextWeek;
}

/**
 * Calculates the number of days a task is overdue
 * @param dueDate - Due date string (ISO format)
 * @param status - Task status (completed tasks are never overdue)
 * @returns Number of days overdue (0 if not overdue)
 */
export function getDaysOverdue(dueDate: string | null | undefined, status: string): number {
  if (!dueDate || status === 'completed' || status === 'cancelled') {
    return 0;
  }
  const today = getTodayNormalized();
  const due = normalizeTaskDate(dueDate);
  if (due >= today) {
    return 0;
  }
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

