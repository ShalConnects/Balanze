import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Account } from '../../types';
import { generateTransactionId, createSuccessMessage } from '../../utils/transactionId';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/currency';
import { CustomDropdown } from '../Purchases/CustomDropdown';

interface DPSTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DPSTransferModal: React.FC<DPSTransferModalProps> = ({ isOpen, onClose }) => {
  const { accounts, transferDPS, loading } = useFinanceStore();
  const dpsAccounts = accounts.filter(a => a.has_dps && a.dps_savings_account_id);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedAccount = dpsAccounts.find(a => a.id === selectedAccountId);
  const linkedSavingsAccount = selectedAccount && accounts.find(a => a.id === selectedAccount.dps_savings_account_id);
  const fixedAmount = selectedAccount?.dps_amount_type === 'fixed' ? selectedAccount.dps_fixed_amount : null;
  const isFixedAmount = selectedAccount && selectedAccount.dps_amount_type === 'fixed';

  // Cleanup timeout on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Clear timeout when modal closes
  useEffect(() => {
    if (!isOpen && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (loading) return;
    
    if (!selectedAccountId) {
      setError('Please select a DPS account.');
      toast.error('Please select a DPS account');
      return;
    }
    
    if (!selectedAccount || !linkedSavingsAccount) {
      setError('Invalid account selection.');
      toast.error('Invalid account selection');
      return;
    }

    // Check if accounts are still active
    if (!selectedAccount.isActive || !linkedSavingsAccount.isActive) {
      const errorMsg = 'One or both accounts are inactive. Please select active accounts.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Check if DPS is still enabled
    if (!selectedAccount.has_dps) {
      const errorMsg = 'DPS is no longer enabled for this account.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    let transferAmount = amount;
    if (isFixedAmount && selectedAccount?.dps_fixed_amount != null) {
      transferAmount = selectedAccount.dps_fixed_amount.toString();
    }
    
    if (!isFixedAmount && !amount) {
      setError('Please enter an amount.');
      toast.error('Please enter an amount');
      return;
    }
    
    // Validate amount
    const amountValue = parseFloat(transferAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount greater than 0.');
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    // Validate fixed amount if applicable
    if (isFixedAmount && selectedAccount.dps_fixed_amount != null) {
      if (selectedAccount.dps_fixed_amount <= 0) {
        const errorMsg = 'Fixed DPS amount must be greater than 0. Please update the account settings.';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
    }

    // Validate maximum amount (prevent extremely large transfers)
    if (amountValue > 999999999) {
      const errorMsg = 'Amount is too large. Maximum transfer amount is 999,999,999';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    // Check for insufficient funds
    if (selectedAccount.calculated_balance < amountValue) {
      const errorMsg = `Insufficient funds. Available balance: ${formatCurrency(selectedAccount.calculated_balance, selectedAccount.currency)}`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    setError('');
    setSuccess('');
    try {
      // Generate transaction ID
      const transactionId = generateTransactionId();
      
      await transferDPS({
        from_account_id: selectedAccountId,
        amount: amountValue,
        transaction_id: transactionId
      });
      
      // Show success toast with transaction ID
      const successMessage = createSuccessMessage('DPS Transfer', transactionId, 
        `${formatCurrency(amountValue, selectedAccount.currency)} from ${selectedAccount.name} to ${linkedSavingsAccount.name}`);
      toast.success(successMessage);
      
      setSuccess('DPS transfer successful!');
      setAmount('');
      setSelectedAccountId('');
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout with cleanup
      timeoutRef.current = setTimeout(() => {
        setSuccess('');
        onClose();
        timeoutRef.current = null;
      }, 1200);
    } catch (err: any) {
      // Show specific error message if available
      const errorMessage = err?.message || 'DPS transfer failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const getInputClasses = (fieldName: string) => {
    const baseClasses = "w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";
    const errorClasses = "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600";
    const normalClasses = "border-gray-200 focus:ring-blue-500";
    
    return `${baseClasses} ${errors[fieldName] ? errorClasses : normalClasses}`;
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
              DPS Transfer
            </Dialog.Title>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close modal"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {dpsAccounts.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3 0 1.657 1.343 3 3 3s3-1.343 3-3c0-1.657-1.343-3-3-3zm0 10c-4.418 0-8-1.79-8-4V6a2 2 0 012-2h12a2 2 0 012 2v8c0 2.21-3.582 4-8 4z" /></svg>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">No DPS accounts found</h3>
              <p className="text-sm text-gray-600 mb-4">
                You don’t have any DPS accounts set up yet.
              </p>
              <a
                href="/accounts"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Create one?
              </a>
            </div>
          ) : (
            <>
              {success && <div className="mb-4 p-4 text-green-700 bg-green-100 rounded-md">{success}</div>}
              {error && <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">DPS Account</label>
                  <CustomDropdown
                    value={selectedAccountId}
                    onChange={(value: string) => setSelectedAccountId(value)}
                    options={dpsAccounts.map(account => ({
                      value: account.id,
                      label: `${account.name} (${formatCurrency(account.calculated_balance, account.currency)})`
                    }))}
                    placeholder="Select DPS account"
                    disabled={loading}
                  />
                </div>
                {selectedAccount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Linked Savings Account</label>
                    <input
                      type="text"
                      value={linkedSavingsAccount ? linkedSavingsAccount.name : ''}
                      className={getInputClasses('linked_account')}
                      disabled
                    />
                  </div>
                )}
                {(selectedAccountId && dpsAccounts.find(a => a.id === selectedAccountId)?.dps_amount_type !== 'fixed') && (
                  <div className="mt-4">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      Amount
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={isFixedAmount && selectedAccount?.dps_fixed_amount != null ? selectedAccount.dps_fixed_amount.toString() : amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={getInputClasses('amount')}
                      step="0.01"
                      disabled={loading || isFixedAmount}
                      placeholder={isFixedAmount ? `Fixed: ${selectedAccount?.dps_fixed_amount}` : ''}
                      {...(!isFixedAmount ? { required: true } : {})}
                    />
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Transferring...' : 'Transfer'}
                  </button>
                </div>
              </form>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 

