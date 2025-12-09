import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Dialog } from '@headlessui/react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Account } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';
import { formatTimeUTC } from '../../utils/timezoneUtils';
import { supabase } from '../../lib/supabase';
import { ArrowRight, Info, RefreshCw, X } from 'lucide-react';
import { getSuggestedRate, formatExchangeRate, isValidExchangeRate } from '../../utils/exchangeRate';
import { toast } from 'sonner';
import { generateTransactionId, createSuccessMessage, TRANSACTION_TYPES } from '../../utils/transactionId';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { Loader } from '../common/Loader';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'currency' | 'dps' | 'inbetween';
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, mode = 'currency' }) => {
  const { accounts, transfer, loading, error } = useFinanceStore();
  const { isMobile } = useMobileDetection();
  const [formData, setFormData] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    exchange_rate: '1',
    note: ''
  });

  // State for transfer history
  const [transfers, setTransfers] = useState<any[]>([]);
  const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for Max button tooltip
  const [showMaxTooltip, setShowMaxTooltip] = useState(false);
  const [showMaxMobileModal, setShowMaxMobileModal] = useState(false);
  const maxButtonRef = useRef<HTMLButtonElement>(null);
  const maxTooltipRef = useRef<HTMLDivElement>(null);
  const [maxTooltipPosition, setMaxTooltipPosition] = useState({ top: 0, left: 0 });

  // Get selected accounts
  const fromAccount = accounts.find(a => a.id === formData.from_account_id);
  const toAccount = accounts.find(a => a.id === formData.to_account_id);
  const isDifferentCurrency = fromAccount && toAccount && fromAccount.currency !== toAccount.currency;
  const convertedAmount = parseFloat(formData.amount) * parseFloat(formData.exchange_rate);

  // Filter accounts based on mode
  const getFilteredAccounts = () => {
    // First filter for active accounts only
    const activeAccounts = accounts.filter(account => account.isActive);
    
    switch (mode) {
      case 'dps':
        // For DPS transfers, show only DPS accounts
        return activeAccounts.filter(account => account.name.includes('(DPS)'));
      case 'inbetween':
        // For in-between transfers, show only main (non-DPS) accounts (exclude any with '(DPS)' in the name)
        return activeAccounts.filter(account => !account.name.includes('(DPS)'));
      case 'currency':
      default:
        // For currency transfers, show only main (non-DPS) accounts (exclude any with '(DPS)' in the name)
        return activeAccounts.filter(account => !account.name.includes('(DPS)'));
    }
  };

  const availableAccounts = getFilteredAccounts();
  
  // Filter destination accounts based on source selection and mode
  const destinationAccounts = availableAccounts.filter(account => {
    if (!fromAccount) return true;
    // Don't allow same account
    if (account.id === fromAccount.id) return false;
    // For in-between transfers, only allow same currency
    if (mode === 'inbetween') {
      return account.currency === fromAccount.currency;
    }
    // For currency transfers, hide accounts with the same currency (force currency conversion)
    if (mode === 'currency') {
      return account.currency !== fromAccount.currency;
    }
    // For other modes, allow any account
    return true;
  });

  // Fetch transfer history on mount (only for DPS mode)
  useEffect(() => {
    if (isOpen && mode === 'dps') {
      fetchTransferHistory();
    }
  }, [isOpen, mode]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        exchange_rate: '1',
        note: ''
      });
    }
  }, [isOpen]);

  // Auto-suggest exchange rate when accounts change (only for currency mode)
  useEffect(() => {
    if (mode === 'currency' && isDifferentCurrency && fromAccount && toAccount) {
      const suggestedRate = getSuggestedRate(fromAccount.currency, toAccount.currency);
      if (suggestedRate && suggestedRate !== 1) {
        setFormData(prev => ({ ...prev, exchange_rate: suggestedRate.toString() }));
      }
    }
  }, [mode, isDifferentCurrency, fromAccount?.currency, toAccount?.currency]);

  // Calculate tooltip position for desktop
  useEffect(() => {
    const calculatePosition = () => {
      if (showMaxTooltip && !isMobile && maxButtonRef.current && maxTooltipRef.current) {
        const buttonRect = maxButtonRef.current.getBoundingClientRect();
        const tooltipRect = maxTooltipRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Position tooltip below the button, centered
        let top = buttonRect.bottom + 8;
        let left = buttonRect.left + (buttonRect.width / 2) - (tooltipRect.width / 2);

        // Adjust if tooltip would go off-screen to the left
        if (left < 8) {
          left = 8;
        }
        // Adjust if tooltip would go off-screen to the right
        if (left + tooltipRect.width > viewportWidth - 8) {
          left = viewportWidth - tooltipRect.width - 8;
        }
        // Adjust if tooltip would go off-screen at the bottom
        if (top + tooltipRect.height > viewportHeight - 8) {
          top = buttonRect.top - tooltipRect.height - 8;
        }

        setMaxTooltipPosition({ top, left });
      }
    };

    // Calculate position after a brief delay to ensure tooltip is rendered
    const timeoutId = setTimeout(calculatePosition, 0);
    
    // Recalculate on window resize
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [showMaxTooltip, isMobile]);

  // Prevent body scroll when mobile modal is open
  useEffect(() => {
    if (showMaxMobileModal && isMobile) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showMaxMobileModal, isMobile]);

  const fetchTransferHistory = async () => {
    try {
      // Fetch regular transfers
      const { data: transferData, error: transferError } = await supabase
        .from('transactions')
        .select('*')
        .eq('category', 'Transfer')
        .order('date', { ascending: false });

      if (transferError) throw transferError;
      setTransfers(transferData || []);

      // Fetch DPS transfers
      const { data: dpsData, error: dpsError } = await supabase
        .from('dps_transfers')
        .select('*, from_account:accounts!from_account_id(name), to_account:accounts!to_account_id(name)')
        .order('date', { ascending: false });

      if (dpsError) throw dpsError;
      setDpsTransfers(dpsData || []);
    } catch (err) {

    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.from_account_id || !formData.to_account_id || !formData.amount) return;

    if (!fromAccount || !toAccount) return;

    // Validate exchange rate
    const rate = parseFloat(formData.exchange_rate);
    if (!isValidExchangeRate(rate)) {
      toast.error('Please enter a valid exchange rate (between 0 and 10,000)');
      return;
    }

    try {
      // Set loading state to true
      useFinanceStore.setState({ loading: true });
      // Generate transaction ID before transfer
      const transactionId = generateTransactionId();
      await transfer({
        from_account_id: formData.from_account_id,
        to_account_id: formData.to_account_id,
        from_amount: parseFloat(formData.amount),
        exchange_rate: rate,
        note: formData.note,
        transaction_id: transactionId
      });

      // Show success notification with transaction ID
      const transferType = mode === 'inbetween' ? 'In-between Transfer' : 
                          mode === 'dps' ? 'DPS Transfer' : 
                          'Currency Transfer';
      const successMessage = createSuccessMessage(transferType, transactionId, 
        `${formatCurrency(parseFloat(formData.amount), fromAccount.currency)} from ${fromAccount.name} to ${toAccount.name}`);
      toast.success(successMessage);

      setFormData({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        exchange_rate: '1',
        note: ''
      });
      
      // Refresh transfer history for all transfer types
      fetchTransferHistory();
      
      // Only close modal after success
      onClose();
    } catch (err) {

      toast.error('Transfer failed. Please try again.');
    } finally {
      // Set loading state to false
      useFinanceStore.setState({ loading: false });
    }
  };

  const handleAccountChange = (field: 'from_account_id' | 'to_account_id', value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value,
      // Reset exchange rate to 1 when accounts change
      exchange_rate: '1'
    }));
  };

  const handleRefreshRate = async () => {
    if (!fromAccount || !toAccount) return;
    
    setIsLoadingRate(true);
    try {
      const suggestedRate = getSuggestedRate(fromAccount.currency, toAccount.currency);
      if (suggestedRate && suggestedRate !== 1) {
        setFormData(prev => ({ ...prev, exchange_rate: suggestedRate.toString() }));
      }
    } catch (error) {

    } finally {
      setIsLoadingRate(false);
    }
  };

  const getInputClasses = (fieldName: string) => {
    const baseClasses = "w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";
    const errorClasses = "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600";
    const normalClasses = "border-gray-200 focus:ring-blue-500";
    
    return `${baseClasses} ${errors[fieldName] ? errorClasses : normalClasses}`;
  };

  return (
    <>
      <Loader isLoading={loading} message="Saving transfer..." />
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {mode === 'inbetween' ? 'In-between Transfer' : 
               mode === 'dps' ? 'DPS Transfer' : 
               'Currency Transfer'}
            </Dialog.Title>

            {error && (
              <div className="mb-4 p-4 text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded-md">
                {error}
              </div>
            )}

            {/* Currency Transfer Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    From Account
                  </label>
                  <CustomDropdown
                    value={formData.from_account_id}
                    onChange={(value: string) => handleAccountChange('from_account_id', value)}
                    options={availableAccounts.map((account: Account) => ({
                      value: account.id,
                      label: `${account.name} (${account.type}) • ${formatCurrency(account.calculated_balance, account.currency)}`
                    }))}
                    placeholder="Select account"
                    disabled={loading}
                  />
                  {errors.from_account_id && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" /> {errors.from_account_id}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    To Account
                  </label>
                  <CustomDropdown
                    value={formData.to_account_id}
                    onChange={(value: string) => handleAccountChange('to_account_id', value)}
                    options={destinationAccounts.map((account: Account) => ({
                      value: account.id,
                      label: `${account.name} (${account.type}) • ${formatCurrency(account.calculated_balance, account.currency)}`
                    }))}
                    placeholder="Select account"
                    disabled={loading}
                  />
                  {errors.to_account_id && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" /> {errors.to_account_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Currency Conversion Display */}
              {mode === 'currency' && isDifferentCurrency && fromAccount && toAccount && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Currency Conversion Required
                    </span>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p>Converting from {fromAccount.currency} to {toAccount.currency}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-gray-400 dark:text-gray-500 text-sm">{fromAccount?.currency || ''}</span>
                    <input
                      type="number"
                      id="amount"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className={getInputClasses('amount') + ' pl-10 pr-16'}
                      required
                      step="0.01"
                      min="0"
                      disabled={loading}
                      placeholder={`Amount${fromAccount ? ` (${fromAccount.currency})` : ''}`}
                    />
                    {fromAccount && (
                      <div className="relative">
                        <button
                          ref={maxButtonRef}
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded transition-colors touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isMobile) {
                              setShowMaxMobileModal(true);
                            } else {
                              setFormData(prev => ({ ...prev, amount: fromAccount.calculated_balance.toString() }));
                            }
                          }}
                          onMouseEnter={() => {
                            if (!isMobile) {
                              setShowMaxTooltip(true);
                            }
                          }}
                          onMouseLeave={() => {
                            if (!isMobile) {
                              setShowMaxTooltip(false);
                            }
                          }}
                          onFocus={() => {
                            if (!isMobile) {
                              setShowMaxTooltip(true);
                            }
                          }}
                          onBlur={() => {
                            if (!isMobile) {
                              setShowMaxTooltip(false);
                            }
                          }}
                          tabIndex={0}
                          aria-label="Fill with maximum available balance"
                        >
                          Max
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.amount && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" /> {errors.amount}
                    </div>
                  )}
                </div>

                {/* Exchange Rate and Note Side by Side */}
                {mode === 'currency' && isDifferentCurrency ? (
                  <div className="flex flex-col gap-2 h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        {/* Remove label, move to placeholder */}
                        <span></span>
                        {/* Refresh button and tooltip removed as per user request */}
                      </div>
                      <div className="mt-1 relative">
                        <input
                          type="number"
                          id="exchange_rate"
                          value={formData.exchange_rate}
                          onChange={(e) => setFormData(prev => ({ ...prev, exchange_rate: e.target.value }))}
                          className={getInputClasses('exchange_rate') + ' pr-16'}
                          required
                          step="0.0001"
                          min="0"
                          disabled={loading}
                          placeholder="Exchange Rate"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {fromAccount?.currency}→{toAccount?.currency}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Rate: {formatExchangeRate(parseFloat(formData.exchange_rate), fromAccount?.currency || '', toAccount?.currency || '')}
                      </p>
                      {errors.exchange_rate && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <Info className="w-3 h-3" /> {errors.exchange_rate}
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        id="note"
                        value={formData.note}
                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                        className={getInputClasses('note')}
                        disabled={loading}
                        placeholder="Note (Optional)"
                      />
                      {errors.note && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <Info className="w-3 h-3" /> {errors.note}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      id="note"
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                      className={getInputClasses('note')}
                      disabled={loading}
                      placeholder="Note (Optional)"
                    />
                    {errors.note && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" /> {errors.note}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Conversion Preview */}
              {mode === 'currency' && isDifferentCurrency && formData.amount && formData.exchange_rate && (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(parseFloat(formData.amount), fromAccount?.currency || 'USD')}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(convertedAmount, toAccount?.currency || 'USD')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Rate: {formatExchangeRate(parseFloat(formData.exchange_rate), fromAccount?.currency || '', toAccount?.currency || '')}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-primary hover:bg-gradient-primary-hover text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !formData.from_account_id || !formData.to_account_id || !formData.amount || parseFloat(formData.amount) <= 0}
                  aria-busy={loading}
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? 'Transferring...' : 'Transfer'}
                </button>
              </div>
            </form>

            {/* Transfer History Section - Only show for DPS transfers */}
            {mode === 'dps' && (transfers.length > 0 || dpsTransfers.length > 0) && (
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Transfers</h3>
                
                {/* Regular Transfers */}
                {transfers.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Currency Transfers</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {transfers.slice(0, 5).map((transfer) => {
                        const fromAcc = accounts.find(a => a.id === transfer.account_id);
                        const toAccountId = transfer.tags?.[2];
                        const toAmount = transfer.tags?.[3];
                        const toAcc = accounts.find(a => a.id === toAccountId);

                        return (
                          <div key={transfer.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-white">{fromAcc?.name}</span>
                                <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                <span className="font-medium text-gray-900 dark:text-white">{toAcc?.name}</span>
                              </div>
                              <span className="text-gray-500 dark:text-gray-400">
                                {format(new Date(transfer.date), 'MMM d')} • {formatTimeUTC(transfer.created_at, 'h:mm a')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-red-600">
                                -{formatCurrency(transfer.amount, fromAcc?.currency || 'USD')}
                              </span>
                              <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                              <span className="text-green-600">
                                +{formatCurrency(parseFloat(toAmount || '0'), toAcc?.currency || 'USD')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* DPS Transfers */}
                {dpsTransfers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">DPS Transfers</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {dpsTransfers.slice(0, 5).map((transfer) => (
                        <div key={transfer.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-white">{transfer.from_account?.name}</span>
                              <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                              <span className="font-medium text-gray-900 dark:text-white">{transfer.to_account?.name}</span>
                            </div>
                            <span className="text-gray-500 dark:text-gray-400">
                              {format(new Date(transfer.date), 'MMM d')} • {formatTimeUTC(transfer.created_at, 'h:mm a')}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className="text-purple-600">
                              {formatCurrency(transfer.amount, transfer.from_account?.currency || 'USD')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Max Button Tooltip - Portal for desktop */}
      {showMaxTooltip && !isMobile && createPortal(
        <div
          ref={maxTooltipRef}
          className="fixed z-[100] w-64 sm:w-72 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-3 text-xs text-gray-700 dark:text-gray-200 animate-fadein"
          style={{
            top: `${maxTooltipPosition.top}px`,
            left: `${maxTooltipPosition.left}px`,
          }}
          onMouseEnter={() => setShowMaxTooltip(true)}
          onMouseLeave={() => setShowMaxTooltip(false)}
        >
          {/* Arrow pointer pointing up towards button */}
          <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-gray-200 dark:border-b-gray-700"></div>
          <div className="absolute left-1/2 -top-[1px] -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-white dark:border-b-gray-900"></div>
          <div className="space-y-1 text-center">
            <p>Fill with the maximum available balance from this account.</p>
            <p className="font-semibold">Click to auto-fill the amount field.</p>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Modal for Max Button Info - Portal */}
      {showMaxMobileModal && isMobile && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setShowMaxMobileModal(false)}
          />
          <div 
            className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-4 w-64 animate-fadein z-[100000]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs text-gray-700 dark:text-gray-200 mb-4 text-center">
              <p>Fill with the maximum available balance from this account.</p>
            </div>
            <button
              onClick={() => {
                if (fromAccount) {
                  setFormData(prev => ({ ...prev, amount: fromAccount.calculated_balance.toString() }));
                }
                setShowMaxMobileModal(false);
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium touch-manipulation"
            >
              Fill Max Amount
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}; 

