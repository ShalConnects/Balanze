/**
 * Invoice Email Service
 * Handles sending invoice emails via API endpoint
 */

import { Invoice } from '../types/client';
import { generateInvoicePDFBlob } from './invoiceUtils';

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
 * Includes retry logic, timeout handling, and detailed error messages
 */
export const sendInvoiceEmail = async (
  options: SendInvoiceEmailOptions
): Promise<SendInvoiceEmailResult> => {
  try {
    const {
      invoice,
      recipientEmail,
      subject,
      message,
      companyName,
      companyAddress,
      companyEmail,
      companyPhone,
      companyWebsite
    } = options;

    // Enhanced email validation
    if (!recipientEmail || typeof recipientEmail !== 'string') {
      return {
        success: false,
        error: 'Email address is required'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim())) {
      return {
        success: false,
        error: 'Invalid email address format. Please enter a valid email address.'
      };
    }

    // Validate invoice data
    if (!invoice || !invoice.id || !invoice.invoice_number) {
      return {
        success: false,
        error: 'Invalid invoice data. Please try refreshing the page.'
      };
    }

    // Generate PDF blob with timeout
    let pdfResult;
    try {
      const pdfPromise = generateInvoicePDFBlob({
        invoice,
        companyName,
        companyAddress,
        companyEmail,
        companyPhone,
        companyWebsite
      });

      // Add 30 second timeout for PDF generation
      const timeoutPromise = new Promise<{ success: false; error: string }>((resolve) => {
        setTimeout(() => {
          resolve({
            success: false,
            error: 'PDF generation timed out. The invoice may be too large or complex.'
          });
        }, 30000);
      });

      pdfResult = await Promise.race([pdfPromise, timeoutPromise]);
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      return {
        success: false,
        error: pdfError instanceof Error 
          ? `Failed to generate PDF: ${pdfError.message}`
          : 'Failed to generate invoice PDF. Please try again or contact support.'
      };
    }

    if (!pdfResult.success || !pdfResult.blob) {
      return {
        success: false,
        error: pdfResult.error || 'Failed to generate invoice PDF. Please try again.'
      };
    }

    // Validate PDF blob size (max 10MB)
    if (pdfResult.blob.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: 'PDF file is too large (over 10MB). Please reduce the number of invoice items.'
      };
    }

    // Convert blob to base64 with error handling
    let pdfBase64: string;
    try {
      pdfBase64 = await blobToBase64(pdfResult.blob);
    } catch (base64Error) {
      console.error('Base64 conversion error:', base64Error);
      return {
        success: false,
        error: 'Failed to prepare PDF for email. Please try again.'
      };
    }

    // Call API endpoint with retry logic
    const maxRetries = 2;
    let lastError: string | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const response = await fetch('/api/send-invoice-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            invoiceId: invoice.id,
            recipientEmail: recipientEmail.trim(),
            subject: subject || `Invoice ${invoice.invoice_number} from ${companyName || 'Balanze'}`,
            message: message || getDefaultEmailMessage(invoice),
            pdfBase64,
            pdfFilename: `Invoice-${invoice.invoice_number}.pdf`,
            invoiceNumber: invoice.invoice_number,
            invoiceDate: invoice.invoice_date,
            dueDate: invoice.due_date,
            totalAmount: invoice.total_amount,
            currency: invoice.currency
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle non-JSON responses
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          return {
            success: false,
            error: `Server error (${response.status}). Please check your email configuration or try again later.`
          };
        }

        if (!response.ok) {
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              success: false,
              error: result.error || `Request failed: ${response.statusText || 'Invalid request'}`
            };
          }

          // Retry on server errors (5xx) or network errors
          lastError = result.error || `Server error (${response.status}). Attempt ${attempt + 1} of ${maxRetries + 1}.`;
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
            continue;
          }
        } else {
          return {
            success: true,
            message: result.message || 'Invoice email sent successfully',
            messageId: result.messageId
          };
        }
      } catch (fetchError: any) {
        // Handle abort (timeout)
        if (fetchError.name === 'AbortError') {
          lastError = 'Request timed out. Please check your internet connection and try again.';
        } else if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
          lastError = 'Network error. Please check your internet connection and try again.';
        } else {
          lastError = fetchError.message || 'Failed to send email. Please try again.';
        }

        // Retry on network errors
        if (attempt < maxRetries && (fetchError.name === 'AbortError' || fetchError instanceof TypeError)) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      }
    }

    return {
      success: false,
      error: lastError || 'Failed to send invoice email after multiple attempts. Please try again later.'
    };
  } catch (error) {
    console.error('Unexpected error sending invoice email:', error);
    return {
      success: false,
      error: error instanceof Error 
        ? `An unexpected error occurred: ${error.message}`
        : 'An unexpected error occurred. Please try again or contact support.'
    };
  }
};

/**
 * Convert blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Get default email message for invoice
 */
const getDefaultEmailMessage = (invoice: Invoice): string => {
  const clientName = invoice.client?.name || 'Client';
  const invoiceNumber = invoice.invoice_number;
  const totalAmount = invoice.total_amount;
  const currency = invoice.currency;
  const dueDate = new Date(invoice.due_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <p>Dear ${clientName},</p>
    <p>Please find attached invoice <strong>${invoiceNumber}</strong> for your records.</p>
    <p><strong>Invoice Details:</strong></p>
    <ul>
      <li>Invoice Number: ${invoiceNumber}</li>
      <li>Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</li>
      <li>Due Date: ${dueDate}</li>
      <li>Total Amount: ${currency} ${totalAmount.toFixed(2)}</li>
    </ul>
    <p>Please review the attached invoice and let us know if you have any questions.</p>
    <p>Thank you for your business!</p>
    <p>Best regards,<br>Balanze Team</p>
  `;
};

