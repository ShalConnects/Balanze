import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, Calendar, DollarSign, Loader2, Send, Download, CheckCircle, X, Mail } from 'lucide-react';
import { useClientStore } from '../../store/useClientStore';
import { Invoice } from '../../types/client';
import { InvoiceForm } from './InvoiceForm';
import { Loader } from '../common/Loader';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { format, isPast, parseISO } from 'date-fns';
import { getCurrencySymbol } from '../../utils/currency';
import { generateInvoicePDF } from '../../utils/invoiceUtils';
import { sendInvoiceEmail } from '../../utils/invoiceEmailService';
import { toast } from 'sonner';

export const InvoiceList: React.FC = () => {
  const {
    invoices,
    clients,
    loading,
    fetchInvoices,
    fetchClients,
    deleteInvoice,
    markInvoiceAsSent,
    markInvoiceAsPaid
  } = useClientStore();

  const { isMobile } = useMobileDetection();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<Invoice | null>(null);
  const [emailForm, setEmailForm] = useState({ recipientEmail: '', subject: '', message: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchInvoices();
  }, [fetchClients, fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || invoice.payment_status === paymentFilter;
      const matchesClient = clientFilter === 'all' || invoice.client_id === clientFilter;

      // Check if overdue
      const isOverdue = invoice.status !== 'paid' && invoice.status !== 'cancelled' && isPast(parseISO(invoice.due_date));
      const matchesOverdue = statusFilter !== 'overdue' || isOverdue;

      return matchesSearch && matchesStatus && matchesPayment && matchesClient && matchesOverdue;
    });
  }, [invoices, searchTerm, statusFilter, paymentFilter, clientFilter]);

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (deletingInvoice) {
      await deleteInvoice(deletingInvoice.id);
      setDeletingInvoice(null);
    }
  };

  const handleMarkAsSent = async (invoice: Invoice) => {
    await markInvoiceAsSent(invoice.id, invoice.client?.email);
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    await markInvoiceAsPaid(invoice.id);
  };

  const handleSendEmail = (invoice: Invoice) => {
    setSendingInvoice(invoice);
    setEmailForm({
      recipientEmail: invoice.client?.email || '',
      subject: `Invoice ${invoice.invoice_number} from Balanze`,
      message: ''
    });
  };

  const handleSendEmailSubmit = async () => {
    if (!sendingInvoice) return;

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailForm.recipientEmail || !emailForm.recipientEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!emailRegex.test(emailForm.recipientEmail.trim())) {
      toast.error('Please enter a valid email address (e.g., name@example.com)');
      return;
    }

    setSendingEmail(true);
    try {
      const result = await sendInvoiceEmail({
        invoice: sendingInvoice,
        recipientEmail: emailForm.recipientEmail.trim(),
        subject: emailForm.subject,
        message: emailForm.message
      });

      if (result.success) {
        toast.success(result.message || 'Invoice email sent successfully!');
        await markInvoiceAsSent(sendingInvoice.id, emailForm.recipientEmail.trim());
        setSendingInvoice(null);
        setEmailForm({ recipientEmail: '', subject: '', message: '' });
        fetchInvoices(); // Refresh to update last_sent_at
      } else {
        // Show detailed error message
        const errorMessage = result.error || 'Failed to send invoice email';
        toast.error(errorMessage, {
          duration: errorMessage.length > 100 ? 8000 : 5000, // Longer duration for detailed messages
        });
      }
    } catch (error) {
      console.error('Error sending invoice email:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to send email: ${error.message}`
        : 'An unexpected error occurred. Please try again.';
      toast.error(errorMessage, {
        duration: 6000,
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    // Validate invoice has required data
    if (!invoice.items || invoice.items.length === 0) {
      toast.error('Cannot generate PDF: Invoice must have at least one item');
      return;
    }

    try {
      const result = await generateInvoicePDF({
        invoice
      });
      if (result.success) {
        toast.success('Invoice PDF downloaded successfully');
      } else {
        // Show detailed error message
        const errorMessage = result.error || 'Failed to generate PDF';
        toast.error(errorMessage, {
          duration: errorMessage.length > 100 ? 8000 : 5000, // Longer duration for detailed messages
        });
      }
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      const errorMessage = error instanceof Error
        ? `Failed to download PDF: ${error.message}`
        : 'An unexpected error occurred while generating the PDF. Please try again.';
      toast.error(errorMessage, {
        duration: 6000,
      });
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInvoice(null);
    fetchInvoices(); // Refresh list after form closes
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      draft: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      sent: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      paid: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      overdue: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      cancelled: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: Invoice['payment_status']) => {
    const styles = {
      unpaid: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      partial: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      paid: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[paymentStatus]}`}>
        {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  };

  const isInvoiceOverdue = (invoice: Invoice) => {
    return invoice.status !== 'paid' && invoice.status !== 'cancelled' && isPast(parseISO(invoice.due_date));
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Loader isLoading={loading} message="Loading invoices..." />
      
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your client invoices
            </p>
          </div>
          <button
            onClick={() => {
              setEditingInvoice(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Invoice
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search invoices by number or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Clients</option>
            {clients
              .filter((c) => c.status === 'active')
              .map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{invoices.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Unpaid</p>
            <p className="text-2xl font-bold text-red-600">
              {invoices.filter((i) => i.payment_status === 'unpaid').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
            <p className="text-2xl font-bold text-red-600">
              {invoices.filter((i) => isInvoiceOverdue(i)).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {invoices.filter((i) => i.payment_status === 'paid').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(
                invoices
                  .filter((i) => i.payment_status !== 'paid')
                  .reduce((sum, i) => sum + i.total_amount - i.paid_amount, 0),
                invoices[0]?.currency || 'USD'
              )}
            </p>
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || clientFilter !== 'all'
                ? 'No invoices match your filters'
                : 'No invoices yet. Create your first invoice to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => {
              const overdue = isInvoiceOverdue(invoice);
              return (
                <div
                  key={invoice.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg p-6 border ${
                    overdue ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
                  } hover:shadow-lg transition-shadow`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {invoice.invoice_number}
                        </h3>
                        {getStatusBadge(invoice.status)}
                        {getPaymentStatusBadge(invoice.payment_status)}
                        {overdue && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Client:</span> {invoice.client?.name || 'Unknown'}
                          {invoice.client?.company_name && ` (${invoice.client.company_name})`}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Invoice: {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                          </span>
                          <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                            <Calendar className="w-4 h-4" />
                            Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {invoice.payment_status === 'partial' && (
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            Paid: {formatCurrency(invoice.paid_amount, invoice.currency)} /{' '}
                            {formatCurrency(invoice.total_amount, invoice.currency)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1 justify-end sm:justify-start">
                        <DollarSign className="w-5 h-5" />
                        {formatCurrency(invoice.total_amount, invoice.currency)}
                      </p>
                      {invoice.payment_status !== 'paid' && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Outstanding: {formatCurrency(invoice.total_amount - invoice.paid_amount, invoice.currency)}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {invoice.items?.length || 0} item{(invoice.items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {invoice.items && invoice.items.length > 0 && (
                    <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items:</p>
                      <div className="space-y-1">
                        {invoice.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>{item.description}</span>
                            <span>
                              {item.quantity} × {formatCurrency(item.unit_price, invoice.currency)} ={' '}
                              {formatCurrency(item.total, invoice.currency)}
                            </span>
                          </div>
                        ))}
                        {invoice.items.length > 3 && (
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            +{invoice.items.length - 3} more item{invoice.items.length - 3 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice.currency} • Created {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownloadPDF(invoice)}
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        aria-label="Download PDF"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendEmail(invoice)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        aria-label="Send email"
                        title="Send invoice via email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => handleMarkAsSent(invoice)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          aria-label="Mark as sent"
                          title="Mark as sent"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {invoice.payment_status !== 'paid' && (
                        <button
                          onClick={() => handleMarkAsPaid(invoice)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          aria-label="Mark as paid"
                          title="Mark as paid"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        aria-label="Edit invoice"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingInvoice(invoice)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        aria-label="Delete invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Form Modal */}
      <InvoiceForm
        isOpen={showForm}
        onClose={handleCloseForm}
        invoice={editingInvoice}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingInvoice}
        onClose={() => setDeletingInvoice(null)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        recordDetails={
          deletingInvoice ? (
            <div className="space-y-1">
              <p className="font-medium text-blue-900 dark:text-blue-200">{deletingInvoice.invoice_number}</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Client: {deletingInvoice.client?.name || 'Unknown'}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Total: {formatCurrency(deletingInvoice.total_amount, deletingInvoice.currency)}
              </p>
            </div>
          ) : (
            <div>No invoice selected</div>
          )
        }
      />

      {/* Send Email Modal */}
      {sendingInvoice && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={sendingEmail ? undefined : () => setSendingInvoice(null)}
          />
          <div
            className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto z-50 shadow-xl transition-all ${isMobile ? 'pb-32' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Mail className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Send Invoice Email
                </h2>
              </div>
              <button
                onClick={() => {
                  setSendingInvoice(null);
                  setEmailForm({ recipientEmail: '', subject: '', message: '' });
                }}
                disabled={sendingEmail}
                className={`p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${sendingEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recipient Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="recipientEmail"
                  value={emailForm.recipientEmail}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                  required
                  disabled={sendingEmail}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="emailSubject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                  disabled={sendingEmail}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Invoice subject"
                />
              </div>

              <div>
                <label htmlFor="emailMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  id="emailMessage"
                  value={emailForm.message}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, message: e.target.value }))}
                  disabled={sendingEmail}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                  placeholder="Custom message (optional). A default message will be used if left empty."
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Invoice:</strong> {sendingInvoice.invoice_number}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Total:</strong> {formatCurrency(sendingInvoice.total_amount, sendingInvoice.currency)}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                  The invoice PDF will be attached to the email automatically.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setSendingInvoice(null);
                    setEmailForm({ recipientEmail: '', subject: '', message: '' });
                  }}
                  disabled={sendingEmail}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEmailSubmit}
                  disabled={sendingEmail || !emailForm.recipientEmail || !emailForm.recipientEmail.includes('@')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

