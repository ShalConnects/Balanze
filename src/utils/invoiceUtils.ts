/**
 * Invoice PDF Generation Utility
 * Uses jsPDF for client-side PDF generation
 */

import { Invoice } from '../types/client';
import { getCurrencySymbol } from './currency';

export interface InvoicePDFOptions {
  invoice: Invoice;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  logoUrl?: string;
}

/**
 * Generate and download invoice PDF
 * Includes validation and detailed error handling
 */
export const generateInvoicePDF = async (options: InvoicePDFOptions): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate invoice data
    if (!options.invoice) {
      return {
        success: false,
        error: 'Invoice data is required'
      };
    }

    const { invoice, companyName, companyAddress, companyEmail, companyPhone, companyWebsite } = options;

    if (!invoice.invoice_number) {
      return {
        success: false,
        error: 'Invoice number is missing'
      };
    }

    if (!invoice.items || invoice.items.length === 0) {
      return {
        success: false,
        error: 'Invoice must have at least one item'
      };
    }

    // Dynamically import PDF libraries only when needed (lazy load)
    let jsPDF: any;
    let autoTable: any;

    try {
      const imports = await Promise.race([
        Promise.all([
          import('jspdf'),
          import('jspdf-autotable')
        ]),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('PDF library loading timed out')), 10000);
        })
      ]);
      jsPDF = imports[0].default;
      autoTable = imports[1].default;
    } catch (importError) {
      console.error('Error loading PDF libraries:', importError);
      return {
        success: false,
        error: importError instanceof Error && importError.message.includes('timeout')
          ? 'PDF library loading timed out. Please refresh the page and try again.'
          : 'Failed to load PDF libraries. Please refresh the page and try again.'
      };
    }

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to format currency
    const formatCurrency = (amount: number, currency: string): string => {
      const symbol = getCurrencySymbol(currency);
      return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Helper function to format date
    const formatDate = (dateString: string): string => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    // Header Section
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', margin, yPosition);
    yPosition += 10;

    // Company Information (if provided)
    if (companyName) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, margin, yPosition);
      yPosition += 6;
    }

    if (companyAddress) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const addressLines = companyAddress.split('\n');
      addressLines.forEach((line) => {
        if (line.trim()) {
          doc.text(line.trim(), margin, yPosition);
          yPosition += 5;
        }
      });
    }

    if (companyEmail || companyPhone || companyWebsite) {
      yPosition += 2;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      if (companyEmail) {
        doc.text(`Email: ${companyEmail}`, margin, yPosition);
        yPosition += 4;
      }
      if (companyPhone) {
        doc.text(`Phone: ${companyPhone}`, margin, yPosition);
        yPosition += 4;
      }
      if (companyWebsite) {
        doc.text(`Website: ${companyWebsite}`, margin, yPosition);
        yPosition += 4;
      }
      doc.setTextColor(0, 0, 0);
    }

    yPosition += 10;

    // Invoice Details Section (Right side)
    const rightColumnX = pageWidth - margin - 80;
    let rightY = margin + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice Number:', rightColumnX, rightY);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoice_number, rightColumnX + 50, rightY);
    rightY += 6;

    doc.setFont('helvetica', 'normal');
    doc.text('Invoice Date:', rightColumnX, rightY);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDate(invoice.invoice_date), rightColumnX + 50, rightY);
    rightY += 6;

    doc.setFont('helvetica', 'normal');
    doc.text('Due Date:', rightColumnX, rightY);
    doc.setFont('helvetica', 'bold');
    const dueDateColor = new Date(invoice.due_date) < new Date() && invoice.payment_status !== 'paid'
      ? [220, 38, 38] // Red for overdue
      : [0, 0, 0];
    doc.setTextColor(dueDateColor[0], dueDateColor[1], dueDateColor[2]);
    doc.text(formatDate(invoice.due_date), rightColumnX + 50, rightY);
    doc.setTextColor(0, 0, 0);
    rightY += 6;

    doc.setFont('helvetica', 'normal');
    doc.text('Status:', rightColumnX, rightY);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1), rightColumnX + 50, rightY);
    rightY += 6;

    doc.setFont('helvetica', 'normal');
    doc.text('Payment Status:', rightColumnX, rightY);
    doc.setFont('helvetica', 'bold');
    const paymentStatusColor = invoice.payment_status === 'paid'
      ? [34, 197, 94] // Green for paid
      : invoice.payment_status === 'partial'
      ? [234, 179, 8] // Yellow for partial
      : [220, 38, 38]; // Red for unpaid
    doc.setTextColor(paymentStatusColor[0], paymentStatusColor[1], paymentStatusColor[2]);
    doc.text(
      invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1),
      rightColumnX + 50,
      rightY
    );
    doc.setTextColor(0, 0, 0);

    yPosition = Math.max(yPosition, rightY) + 15;

    // Bill To Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', margin, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (invoice.client) {
      doc.text(invoice.client.name, margin, yPosition);
      yPosition += 5;

      if (invoice.client.company_name) {
        doc.text(invoice.client.company_name, margin, yPosition);
        yPosition += 5;
      }

      const clientAddress = [
        invoice.client.address,
        invoice.client.city,
        invoice.client.state,
        invoice.client.postal_code,
        invoice.client.country
      ]
        .filter(Boolean)
        .join(', ');

      if (clientAddress) {
        doc.text(clientAddress, margin, yPosition);
        yPosition += 5;
      }

      if (invoice.client.email) {
        doc.text(`Email: ${invoice.client.email}`, margin, yPosition);
        yPosition += 5;
      }

      if (invoice.client.phone) {
        doc.text(`Phone: ${invoice.client.phone}`, margin, yPosition);
        yPosition += 5;
      }
    } else {
      doc.text('Client information not available', margin, yPosition);
      yPosition += 5;
    }

    yPosition += 10;

    // Items Table
    if (invoice.items && invoice.items.length > 0) {
      const tableData = invoice.items.map((item) => [
        item.description || '',
        item.quantity.toString(),
        formatCurrency(item.unit_price, invoice.currency),
        `${item.tax_rate}%`,
        `${item.discount_rate}%`,
        formatCurrency(item.total, invoice.currency)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Description', 'Qty', 'Unit Price', 'Tax', 'Discount', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246], // Blue header
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: {
          0: { cellWidth: 'auto' }, // Description
          1: { cellWidth: 20, halign: 'right' }, // Qty
          2: { cellWidth: 30, halign: 'right' }, // Unit Price
          3: { cellWidth: 25, halign: 'right' }, // Tax
          4: { cellWidth: 25, halign: 'right' }, // Discount
          5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' } // Total
        },
        margin: { left: margin, right: margin }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Totals Section
    const totalsX = pageWidth - margin - 80;
    yPosition += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Subtotal
    doc.text('Subtotal:', totalsX, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(invoice.subtotal, invoice.currency), totalsX + 50, yPosition, { align: 'right' });
    yPosition += 7;

    // Discount
    if (invoice.discount_amount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text('Discount:', totalsX, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.text(`-${formatCurrency(invoice.discount_amount, invoice.currency)}`, totalsX + 50, yPosition, { align: 'right' });
      yPosition += 7;
    }

    // Tax
    if (invoice.tax_amount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text('Tax:', totalsX, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(invoice.tax_amount, invoice.currency), totalsX + 50, yPosition, { align: 'right' });
      yPosition += 7;
    }

    // Total
    yPosition += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(totalsX, yPosition, totalsX + 60, yPosition);
    yPosition += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', totalsX, yPosition);
    doc.text(formatCurrency(invoice.total_amount, invoice.currency), totalsX + 50, yPosition, { align: 'right' });
    yPosition += 8;

    // Payment Information
    if (invoice.payment_status === 'partial') {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(234, 179, 8); // Yellow
      doc.text(
        `Paid: ${formatCurrency(invoice.paid_amount, invoice.currency)} / ${formatCurrency(invoice.total_amount, invoice.currency)}`,
        totalsX,
        yPosition
      );
      doc.setTextColor(0, 0, 0);
      yPosition += 6;
      doc.text(
        `Outstanding: ${formatCurrency(invoice.total_amount - invoice.paid_amount, invoice.currency)}`,
        totalsX,
        yPosition
      );
      yPosition += 8;
    } else if (invoice.payment_status === 'paid') {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94); // Green
      doc.text('PAID', totalsX, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 8;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(220, 38, 38); // Red
      doc.text(
        `Outstanding: ${formatCurrency(invoice.total_amount - invoice.paid_amount, invoice.currency)}`,
        totalsX,
        yPosition
      );
      doc.setTextColor(0, 0, 0);
      yPosition += 8;
    }

    // Notes Section
    if (invoice.notes) {
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', margin, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const notesLines = doc.splitTextToSize(invoice.notes, contentWidth);
      notesLines.forEach((line: string) => {
        if (yPosition > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      doc.setTextColor(0, 0, 0);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        margin,
        doc.internal.pageSize.getHeight() - 10
      );
      doc.setTextColor(0, 0, 0);
    }

    // Save PDF with error handling
    try {
      const filename = `Invoice-${invoice.invoice_number}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (saveError) {
      console.error('Error saving PDF:', saveError);
      return {
        success: false,
        error: 'Failed to save PDF file. Please check your browser download settings.'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return {
          success: false,
          error: 'PDF generation timed out. The invoice may be too large. Please try again or contact support.'
        };
      }
      if (error.message.includes('memory') || error.message.includes('allocation')) {
        return {
          success: false,
          error: 'Not enough memory to generate PDF. Please close other applications and try again.'
        };
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error while generating PDF. Please check your internet connection and try again.'
        };
      }
      return {
        success: false,
        error: `Failed to generate PDF: ${error.message}`
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred while generating the PDF. Please try again or contact support.'
    };
  }
};

/**
 * Generate invoice PDF as blob (for email attachment or storage)
 * Includes validation and detailed error handling
 */
export const generateInvoicePDFBlob = async (
  options: InvoicePDFOptions
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    // Validate invoice data
    if (!options.invoice) {
      return {
        success: false,
        error: 'Invoice data is required'
      };
    }

    const { invoice, companyName, companyAddress, companyEmail, companyPhone, companyWebsite } = options;

    if (!invoice.invoice_number) {
      return {
        success: false,
        error: 'Invoice number is missing'
      };
    }

    if (!invoice.items || invoice.items.length === 0) {
      return {
        success: false,
        error: 'Invoice must have at least one item'
      };
    }

    // Dynamically import PDF libraries with timeout
    let jsPDF: any;
    let autoTable: any;

    try {
      const imports = await Promise.race([
        Promise.all([
          import('jspdf'),
          import('jspdf-autotable')
        ]),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('PDF library loading timed out')), 10000);
        })
      ]);
      jsPDF = imports[0].default;
      autoTable = imports[1].default;
    } catch (importError) {
      console.error('Error loading PDF libraries:', importError);
      return {
        success: false,
        error: importError instanceof Error && importError.message.includes('timeout')
          ? 'PDF library loading timed out. Please refresh the page and try again.'
          : 'Failed to load PDF libraries. Please refresh the page and try again.'
      };
    }

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper functions (same as above)
    const formatCurrency = (amount: number, currency: string): string => {
      const symbol = getCurrencySymbol(currency);
      return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString: string): string => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    // Header Section (same as generateInvoicePDF)
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', margin, yPosition);
    yPosition += 10;

    // Company Information
    if (companyName) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, margin, yPosition);
      yPosition += 6;
    }

    if (companyAddress) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const addressLines = companyAddress.split('\n');
      addressLines.forEach((line) => {
        if (line.trim()) {
          doc.text(line.trim(), margin, yPosition);
          yPosition += 5;
        }
      });
    }

    // Invoice Details (Right side)
    const rightColumnX = pageWidth - margin - 80;
    let rightY = margin + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice Number:', rightColumnX, rightY);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoice_number, rightColumnX + 50, rightY);
    rightY += 6;

    doc.setFont('helvetica', 'normal');
    doc.text('Invoice Date:', rightColumnX, rightY);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDate(invoice.invoice_date), rightColumnX + 50, rightY);
    rightY += 6;

    doc.setFont('helvetica', 'normal');
    doc.text('Due Date:', rightColumnX, rightY);
    doc.setFont('helvetica', 'bold');
    doc.text(formatDate(invoice.due_date), rightColumnX + 50, rightY);
    rightY += 6;

    yPosition = Math.max(yPosition, rightY) + 15;

    // Bill To Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', margin, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (invoice.client) {
      doc.text(invoice.client.name, margin, yPosition);
      yPosition += 5;

      if (invoice.client.company_name) {
        doc.text(invoice.client.company_name, margin, yPosition);
        yPosition += 5;
      }

      const clientAddress = [
        invoice.client.address,
        invoice.client.city,
        invoice.client.state,
        invoice.client.postal_code,
        invoice.client.country
      ]
        .filter(Boolean)
        .join(', ');

      if (clientAddress) {
        doc.text(clientAddress, margin, yPosition);
        yPosition += 5;
      }
    }

    yPosition += 10;

    // Items Table
    if (invoice.items && invoice.items.length > 0) {
      const tableData = invoice.items.map((item) => [
        item.description || '',
        item.quantity.toString(),
        formatCurrency(item.unit_price, invoice.currency),
        `${item.tax_rate}%`,
        `${item.discount_rate}%`,
        formatCurrency(item.total, invoice.currency)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Description', 'Qty', 'Unit Price', 'Tax', 'Discount', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Totals Section
    const totalsX = pageWidth - margin - 80;
    yPosition += 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(invoice.subtotal, invoice.currency), totalsX + 50, yPosition, { align: 'right' });
    yPosition += 7;

    if (invoice.discount_amount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text('Discount:', totalsX, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.text(`-${formatCurrency(invoice.discount_amount, invoice.currency)}`, totalsX + 50, yPosition, { align: 'right' });
      yPosition += 7;
    }

    if (invoice.tax_amount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text('Tax:', totalsX, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(invoice.tax_amount, invoice.currency), totalsX + 50, yPosition, { align: 'right' });
      yPosition += 7;
    }

    yPosition += 2;
    doc.line(totalsX, yPosition, totalsX + 60, yPosition);
    yPosition += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', totalsX, yPosition);
    doc.text(formatCurrency(invoice.total_amount, invoice.currency), totalsX + 50, yPosition, { align: 'right' });

    // Generate blob with error handling
    let pdfBlob: Blob;
    try {
      pdfBlob = doc.output('blob');
      
      // Validate blob was created
      if (!pdfBlob || pdfBlob.size === 0) {
        return {
          success: false,
          error: 'Generated PDF is empty. Please check the invoice data and try again.'
        };
      }

      // Check blob size (warn if very large, but don't fail)
      if (pdfBlob.size > 10 * 1024 * 1024) {
        console.warn('Generated PDF is very large:', pdfBlob.size, 'bytes');
      }
    } catch (blobError) {
      console.error('Error creating PDF blob:', blobError);
      return {
        success: false,
        error: 'Failed to create PDF file. Please try again or contact support.'
      };
    }

    return { success: true, blob: pdfBlob };
  } catch (error) {
    console.error('Error generating invoice PDF blob:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return {
          success: false,
          error: 'PDF generation timed out. The invoice may be too large. Please try again.'
        };
      }
      if (error.message.includes('memory') || error.message.includes('allocation')) {
        return {
          success: false,
          error: 'Not enough memory to generate PDF. Please close other applications and try again.'
        };
      }
      return {
        success: false,
        error: `Failed to generate PDF: ${error.message}`
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred while generating the PDF. Please try again or contact support.'
    };
  }
};

