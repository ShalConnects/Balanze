/**
 * Invoice Email Service
 * Handles sending invoice emails. API currently disabled — use download PDF instead.
 */

import { Invoice } from '../types/client';

export interface SendInvoiceEmailOptions {
  invoice: Invoice;
  recipientEmail: string;
  subject?: string;
  message?: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
}

export interface SendInvoiceEmailResult {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
}

/**
 * Send invoice email with PDF attachment
 * Invoice email API is currently disabled. Use download PDF instead.
 */
export const sendInvoiceEmail = async (
  options: SendInvoiceEmailOptions
): Promise<SendInvoiceEmailResult> => {
  // Basic validation
  if (!options.recipientEmail || typeof options.recipientEmail !== 'string') {
    return { success: false, error: 'Email address is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(options.recipientEmail.trim())) {
    return { success: false, error: 'Invalid email address format. Please enter a valid email address.' };
  }
  if (!options.invoice?.id || !options.invoice?.invoice_number) {
    return { success: false, error: 'Invalid invoice data. Please try refreshing the page.' };
  }

  // Invoice email is not configured. User can download PDF instead.
  return {
    success: false,
    error: 'Invoice email is not available right now. You can download the PDF and send it manually.'
  };
};

