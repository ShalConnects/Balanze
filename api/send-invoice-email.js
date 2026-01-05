/**
 * API Endpoint: Send Invoice Email
 * Sends invoice email with PDF attachment via SMTP
 */

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

/**
 * Validate email address
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required and must be a string' };
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
        return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
}

/**
 * Create invoice email HTML content
 */
function createInvoiceEmailHTML(invoice, message, companyName) {
    const invoiceNumber = invoice.invoice_number;
    const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const dueDate = new Date(invoice.due_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const totalAmount = invoice.total_amount;
    const currency = invoice.currency;
    const clientName = invoice.client?.name || 'Client';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Invoice ${invoiceNumber}</h1>
    </div>
    
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            ${message || `
                <p>Dear ${clientName},</p>
                <p>Please find attached invoice <strong>${invoiceNumber}</strong> for your records.</p>
                <p><strong>Invoice Details:</strong></p>
                <ul>
                    <li>Invoice Number: ${invoiceNumber}</li>
                    <li>Invoice Date: ${invoiceDate}</li>
                    <li>Due Date: ${dueDate}</li>
                    <li>Total Amount: ${currency} ${totalAmount.toFixed(2)}</li>
                </ul>
                <p>Please review the attached invoice and let us know if you have any questions.</p>
                <p>Thank you for your business!</p>
            `}
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #667eea;">Invoice Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${invoiceNumber}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${invoiceDate}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Due Date:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${dueDate}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Status:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                        <span style="background: ${invoice.status === 'paid' ? '#10b981' : invoice.status === 'sent' ? '#3b82f6' : '#f59e0b'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                            ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Total Amount:</strong></td>
                    <td style="padding: 8px 0; text-align: right; font-size: 18px; font-weight: bold; color: #667eea;">
                        ${currency} ${totalAmount.toFixed(2)}
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>This is an automated email from ${companyName || 'Balanze'}</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Main handler function
 */
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            invoiceId,
            recipientEmail,
            subject,
            message,
            pdfBase64,
            pdfFilename,
            invoiceNumber,
            invoiceDate,
            dueDate,
            totalAmount,
            currency
        } = req.body;

        // Validate inputs
        if (!invoiceId) {
            return res.status(400).json({ error: 'Invoice ID is required' });
        }

        const emailValidation = validateEmail(recipientEmail);
        if (!emailValidation.valid) {
            return res.status(400).json({ error: emailValidation.error });
        }

        if (!transporter) {
            return res.status(500).json({ error: 'SMTP not configured' });
        }

        // Fetch invoice data from database
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select(`
                *,
                client:clients(*),
                items:invoice_items(*)
            `)
            .eq('id', invoiceId)
            .single();

        if (invoiceError || !invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Create email content
        const emailHTML = createInvoiceEmailHTML(
            invoice,
            message,
            process.env.COMPANY_NAME || 'Balanze'
        );

        // Prepare PDF attachment
        const attachments = [];
        if (pdfBase64) {
            attachments.push({
                filename: pdfFilename || `Invoice-${invoiceNumber}.pdf`,
                content: Buffer.from(pdfBase64, 'base64'),
                contentType: 'application/pdf'
            });
        }

        // Send email
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: recipientEmail,
            subject: subject || `Invoice ${invoiceNumber} from ${process.env.COMPANY_NAME || 'Balanze'}`,
            html: emailHTML,
            attachments: attachments
        };

        const result = await transporter.sendMail(mailOptions);

        // Update invoice last_sent_at
        await supabase
            .from('invoices')
            .update({
                last_sent_at: new Date().toISOString(),
                email_recipient: recipientEmail,
                status: invoice.status === 'draft' ? 'sent' : invoice.status
            })
            .eq('id', invoiceId);

        return res.status(200).json({
            success: true,
            message: 'Invoice email sent successfully',
            messageId: result.messageId
        });
    } catch (error) {
        console.error('Error sending invoice email:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to send invoice email'
        });
    }
}

