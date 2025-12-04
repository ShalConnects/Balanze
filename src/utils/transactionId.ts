/**
 * Transaction ID utilities for tracking form submissions and actions
 */

/**
 * Generate a unique transaction ID
 * Creates an 8-digit ID starting with "F"
 */
export const generateTransactionId = (): string => {
  // Generate a random 7-digit number
  const randomDigits = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `F${randomDigits}`;
};

/**
 * Format transaction ID for display (shows full 8-digit ID)
 */
export const formatTransactionId = (transactionId: string): string => {
  if (!transactionId) return '';
  // For F format, show the full ID since it's already short
  return transactionId;
};

/**
 * Copy transaction ID to clipboard
 */
export const copyTransactionIdToClipboard = async (transactionId: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(transactionId);
    return true;
  } catch (err) {

    return false;
  }
};

/**
 * Validate transaction ID format
 */
export const isValidTransactionId = (transactionId: string): boolean => {
  if (!transactionId) return false;
  
  // F format validation: F followed by 7 digits
  const fFormatRegex = /^F\d{7}$/;
  return fFormatRegex.test(transactionId);
};

/**
 * Create transaction metadata object
 */
export const createTransactionMetadata = (
  action: string,
  entityType: string,
  description?: string,
  additionalData?: Record<string, any>
): Record<string, any> => {
  const transactionId = generateTransactionId();
  
  return {
    transaction_id: transactionId,
    action,
    entity_type: entityType,
    description,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
};

/**
 * Extract transaction ID from various sources
 */
export const extractTransactionId = (data: any): string | null => {
  if (!data) return null;
  
  // Direct transaction_id property
  if (data.transaction_id) return data.transaction_id;
  
  // From metadata
  if (data.metadata?.transaction_id) return data.metadata.transaction_id;
  
  // From new_values
  if (data.new_values?.transaction_id) return data.new_values.transaction_id;
  
  // From old_values
  if (data.old_values?.transaction_id) return data.old_values.transaction_id;
  
  return null;
};

/**
 * Create a success message with transaction ID
 */
export const createSuccessMessage = (
  action: string,
  transactionId: string,
  additionalInfo?: string
): string => {
  const baseMessage = `${action} completed successfully`;
  const transactionInfo = `Transaction ID: ${formatTransactionId(transactionId)}`;
  
  if (additionalInfo) {
    return `${baseMessage}. ${additionalInfo} (${transactionInfo})`;
  }
  
  return `${baseMessage} (${transactionInfo})`;
};

/**
 * Transaction ID types for different actions
 */
export const TRANSACTION_TYPES = {
  TRANSACTION_CREATE: 'transaction_create',
  TRANSACTION_UPDATE: 'transaction_update',
  TRANSACTION_DELETE: 'transaction_delete',
  TRANSFER_CREATE: 'transfer_create',
  TRANSFER_UPDATE: 'transfer_update',
  TRANSFER_DELETE: 'transfer_delete',
  ACCOUNT_CREATE: 'account_create',
  ACCOUNT_UPDATE: 'account_update',
  ACCOUNT_DELETE: 'account_delete',
  DPS_TRANSFER_CREATE: 'dps_transfer_create',
  DPS_TRANSFER_UPDATE: 'dps_transfer_update',
  DPS_TRANSFER_DELETE: 'dps_transfer_delete',
  PURCHASE_CREATE: 'purchase_create',
  PURCHASE_UPDATE: 'purchase_update',
  PURCHASE_DELETE: 'purchase_delete',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_UPDATE: 'user_update',
} as const;

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES]; 

