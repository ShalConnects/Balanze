/**
 * Client utility functions for ClientList component
 * Contains color mappings and helper functions
 */

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

