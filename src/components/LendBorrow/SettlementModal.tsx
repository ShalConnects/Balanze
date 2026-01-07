import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Calendar, Loader2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LendBorrow } from '../../types/index';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { toast } from 'sonner';
// DatePicker loaded dynamically to reduce initial bundle size
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
import { LazyDatePicker as DatePicker } from '../common/LazyDatePicker';
import { getCurrencySymbol } from '../../utils/currency';
import { supabase } from '../../lib/supabase';

interface SettlementModalProps {
  record: LendBorrow;
  onClose: () => void;
  onSettle: (accountId: string) => void;
  onRecordUpdated?: () => void; // Callback to refresh data after auto-settle
}

type SettlementType = 'full' | 'partial';

export const SettlementModal: React.FC<SettlementModalProps> = ({ 
  record, 
  onClose, 
  onSettle,
  onRecordUpdated
}) => {
  const { t } = useTranslation();
  const { accounts } = useFinanceStore();
  const { profile } = useAuthStore();
  const [settlementType, setSettlementType] = useState<SettlementType>('full');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [settlementMethod, setSettlementMethod] = useState<'simple' | 'account'>('simple');
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [returnHistory, setReturnHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<{ amount?: boolean }>({});
  const amountRef = useRef<HTMLInputElement | null>(null);


  // Filter accounts by currency, only active accounts (excluding DPS), but include current account if editing
  const sortedAccountOptions = React.useMemo(() => {
    // Get active accounts matching currency (excluding DPS accounts)
    let availableAccounts = accounts.filter(acc => 
      acc.currency === record.currency && 
      acc.isActive && 
      !acc.name.includes('(DPS)')
    );
    
    // If record has an account, include it even if inactive (for context when editing)
    if (record.account_id) {
      const currentAccount = accounts.find(acc => acc.id === record.account_id);
      if (currentAccount && currentAccount.currency === record.currency && !currentAccount.name.includes('(DPS)')) {
        const accountExists = availableAccounts.some(acc => acc.id === currentAccount.id);
        if (!accountExists) {
          availableAccounts = [...availableAccounts, currentAccount];
        }
      }
    }
    
    // Sort: default account first, then by balance (descending)
    return availableAccounts.sort((a, b) => {
      if (a.id === profile?.default_account_id && b.id !== profile?.default_account_id) return -1;
      if (a.id !== profile?.default_account_id && b.id === profile?.default_account_id) return 1;
      return (b.calculated_balance || 0) - (a.calculated_balance || 0);
    });
  }, [accounts, record.currency, record.account_id, profile?.default_account_id]);

  // Set default account on mount (only if it matches the record's currency)
  useEffect(() => {
    if (profile?.default_account_id && !selectedAccountId) {
      const defaultAccount = accounts.find(acc => acc.id === profile.default_account_id);
      if (defaultAccount && defaultAccount.currency === record.currency) {
        setSelectedAccountId(profile.default_account_id);
      } else if (sortedAccountOptions.length > 0) {
        // If default account doesn't match currency, select the first available account
        setSelectedAccountId(sortedAccountOptions[0].id);
      }
    }
  }, [profile?.default_account_id, selectedAccountId, record.currency, accounts, sortedAccountOptions]);

  // Calculate remaining amount for partial returns
  const totalReturned = returnHistory.reduce((sum, ret) => sum + ret.amount, 0) + (record.partial_return_amount || 0);
  const remainingAmount = record.amount - totalReturned;
  
  // Check if record should be auto-settled
  const shouldBeSettled = remainingAmount <= 0;

  
  // Fetch return history on modal open to check for existing partial returns
  useEffect(() => {
      fetchReturnHistory();
  }, [record.id]);

  // Check if record has existing partial returns/payments
  const hasPartialReturns = returnHistory.length > 0 || (record.partial_return_amount && record.partial_return_amount > 0) || false;

  // Auto-set settlement method based on record type and partial returns
  useEffect(() => {
    // For account-linked records: default to 'account' (since original transaction affected balance)
    if (record.account_id) {
      if (hasPartialReturns) {
        setSettlementMethod('account');
      } else {
        setSettlementMethod('account');
      }
    } 
    // For record-only entries: default based on partial returns
    else if (!record.account_id) {
      if (hasPartialReturns) {
        setSettlementMethod('account');
      } else {
        setSettlementMethod('simple');
      }
    }
  }, [record.account_id, hasPartialReturns]);

  // Auto-switch to partial return mode if there are existing partial returns
  useEffect(() => {
    if (hasPartialReturns) {
      setSettlementType('partial');
    }
  }, [hasPartialReturns]);


  const fetchReturnHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('lend_borrow_returns')
        .select('*')
        .eq('lend_borrow_id', record.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReturnHistory(data || []);
    } catch (error) {
      console.error('Error fetching return history:', error);
    }
  };

  const validatePartialAmount = () => {
    if (partialAmount <= 0) return 'Amount must be greater than 0';
    if (partialAmount > remainingAmount) return `Amount cannot exceed remaining amount (${getCurrencySymbol(record.currency)}${remainingAmount.toFixed(2)})`;
    return '';
  };

  const handleAmountBlur = () => {
    setTouched({ amount: true });
    const error = validatePartialAmount();
    setErrors({ amount: error });
  };

  const handleSettlementTypeChange = (type: SettlementType) => {
    setSettlementType(type);
    setErrors({});
    setTouched({});
    if (type === 'partial') {
      setTimeout(() => amountRef.current?.focus(), 100);
    }
  };

  const handlePartialReturn = async () => {
    // Check if record is already settled
    if (record.status === 'settled') {
      toast.error('This record is already settled');
      return;
    }

    const validationError = validatePartialAmount();
    if (validationError) {
      setErrors({ amount: validationError });
      return;
    }

    // Only require account selection when using account settlement method
    if (settlementMethod === 'account' && !selectedAccountId) {
      setErrors({ account: 'Please select an account' });
      return;
    }

    // Validate account currency matches record currency
    if (settlementMethod === 'account' && selectedAccountId) {
      const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
      if (selectedAccount && selectedAccount.currency !== record.currency) {
        setErrors({ account: `Account currency (${selectedAccount.currency}) must match record currency (${record.currency})` });
        return;
      }
    }

    setLoading(true);
    try {
      // Create partial return record

      const { data: returnData, error: returnError } = await supabase
        .from('lend_borrow_returns')
        .insert([{
          lend_borrow_id: record.id,
          amount: partialAmount,
          return_date: returnDate.toISOString(),
          account_id: settlementMethod === 'account' ? selectedAccountId : null, // Only store account_id if using account settlement
        }])
        .select()
        .single();

      if (returnError) {
        throw returnError;
      }

      // For record-only entries with account settlement, create transaction manually
      // since the database trigger won't fire (original record has account_id: null)
      if (!record.account_id && settlementMethod === 'account') {
        const transactionData = {
          user_id: record.user_id,
          account_id: selectedAccountId,
          type: record.type === 'lend' ? 'income' : 'expense', // For lend: we receive money (income), for borrow: we pay money (expense)
          amount: partialAmount,
          description: `${record.type === 'lend' ? 'Partial return from' : 'Partial return to'} ${record.person_name}`,
          category: 'Lend/Borrow',
          date: returnDate.toISOString().split('T')[0],
          tags: ['lend_borrow', 'loan', 'partial'],
          transaction_id: `LB${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
        };

        const { error: transactionError } = await supabase
          .from('transactions')
          .insert([transactionData]);

        if (transactionError) {
          toast.error('Partial return recorded but failed to create transaction');
        }
      }

      // Check if this partial return/payment makes the record fully settled
      const newTotalReturned = totalReturned + partialAmount;
      const newRemainingAmount = record.amount - newTotalReturned;
      
      if (newRemainingAmount <= 0) {
        // The database trigger will automatically settle the record
        // Wait a moment for the trigger to process, then verify
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify the record was settled by the trigger
        const { data: updatedRecord, error: fetchError } = await supabase
          .from('lend_borrow')
          .select('status')
          .eq('id', record.id)
          .single();
        
        if (fetchError) {
          console.error('Error checking settlement status:', fetchError);
          toast.error('Partial return recorded, but failed to verify settlement status');
        } else if (updatedRecord?.status === 'settled') {
          toast.success(`${record.type === 'lend' ? 'Partial return' : 'Partial payment'} of ${getCurrencySymbol(record.currency)}${partialAmount.toFixed(2)} recorded and record automatically settled!`);
        } else {
          // Record wasn't settled by trigger, try manual settlement as fallback
          const { error: settleError } = await supabase
            .from('lend_borrow')
            .update({ 
              status: 'settled',
              updated_at: new Date().toISOString()
            })
            .eq('id', record.id);
          
          if (settleError) {
            console.error('Settlement error:', settleError);
            toast.error(`Failed to auto-settle record: ${settleError.message || 'Unknown error'}`);
          } else {
            toast.success(`${record.type === 'lend' ? 'Partial return' : 'Partial payment'} of ${getCurrencySymbol(record.currency)}${partialAmount.toFixed(2)} recorded and record settled!`);
          }
        }
        
        // Refresh the data to show updated status
        if (onRecordUpdated) {
          onRecordUpdated();
        }
      } else {
        toast.success(`${record.type === 'lend' ? 'Partial return' : 'Partial payment'} of ${getCurrencySymbol(record.currency)}${partialAmount.toFixed(2)} recorded successfully!`);
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || `Failed to record ${record.type === 'lend' ? 'partial return' : 'partial payment'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFullSettlement = () => {
    // Check if record is already settled
    if (record.status === 'settled') {
      toast.error('This record is already settled');
      return;
    }

    // For simple settlement (both record-only and account-linked), just mark as settled
    if (settlementMethod === 'simple') {
      // Update record status to settled without account transaction
      supabase
        .from('lend_borrow')
        .update({ 
          status: 'settled',
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id)
        .then(() => {
          toast.success('Record marked as settled successfully!');
          if (onRecordUpdated) {
            onRecordUpdated();
          }
          onClose();
        })
        .catch((error) => {
          toast.error('Failed to settle record');
        });
      return;
    }

    // For account settlement method, require account selection
    if (settlementMethod === 'account' && !selectedAccountId) {
      setErrors({ account: 'Please select an account' });
      return;
    }

    // Validate account currency matches record currency
    if (settlementMethod === 'account' && selectedAccountId) {
      const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
      if (selectedAccount && selectedAccount.currency !== record.currency) {
        setErrors({ account: `Account currency (${selectedAccount.currency}) must match record currency (${record.currency})` });
        return;
      }
    }
    
    onSettle(selectedAccountId);
    onClose();
  };

  const getSettlementMessage = () => {
    // For simple settlement (both record-only and account-linked), show different message
    if (settlementMethod === 'simple' && !hasPartialReturns) {
      if (settlementType === 'full') {
        return `This will mark the record as settled without affecting any account balances.`;
      } else {
        return `This will record a partial ${record.type === 'lend' ? 'return' : 'payment'} without affecting any account balances.`;
      }
    }
    
    // For account settlement method (both record-only and account-linked)
    if (settlementType === 'full') {
      if (record.type === 'lend') {
        return `Which account did you receive the full repayment of ${record.amount} ${record.currency} in?`;
      } else {
        return `Which account are you paying the full amount of ${record.amount} ${record.currency} from?`;
      }
    } else {
      if (record.type === 'lend') {
        return `Which account did you receive the partial repayment in?`;
      } else {
        return `Which account are you making the partial payment from?`;
      }
    }
  };

  const getSettlementTitle = () => {
    return record.type === 'lend' ? 'Settle Loan' : 'Settle Borrowing';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getSettlementTitle()}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Record Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {record.type === 'lend' ? 'Lent to' : 'Borrowed from'}: <span className="font-medium">{record.person_name}</span>
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {getCurrencySymbol(record.currency)}{record.amount}
            </div>
            {settlementType === 'partial' && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <div>Total Returned: {getCurrencySymbol(record.currency)}{totalReturned.toFixed(2)}</div>
                <div>Remaining: {getCurrencySymbol(record.currency)}{remainingAmount.toFixed(2)}</div>
              </div>
            )}
          </div>

          {/* Settlement Method Selection - Show for all records to let users choose between simple and account settlement */}
          {(
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                How would you like to settle this record?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`relative flex items-center justify-center p-4 border-2 rounded-lg transition-all duration-300 shadow-sm ${
                  settlementMethod === 'simple'
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-400 cursor-pointer shadow-md' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer hover:shadow-md'
                }`}>
                  <input
                    type="radio"
                    name="settlementMethod"
                    value="simple"
                    checked={settlementMethod === 'simple'}
                    onChange={() => setSettlementMethod('simple')}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className={`w-4 h-4 rounded-full border-2 mx-auto mb-2 ${
                      settlementMethod === 'simple' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {settlementMethod === 'simple' && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      settlementMethod === 'simple' 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      Just mark as settled
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      No account balance changes
                    </div>
                  </div>
                </label>
                
                <label className={`relative flex items-center justify-center p-4 border-2 rounded-lg transition-all duration-300 shadow-sm ${
                  settlementMethod === 'account'
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-400 cursor-pointer shadow-md' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer hover:shadow-md'
                }`}>
                  <input
                    type="radio"
                    name="settlementMethod"
                    value="account"
                    checked={settlementMethod === 'account'}
                    onChange={() => setSettlementMethod('account')}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className={`w-4 h-4 rounded-full border-2 mx-auto mb-2 ${
                      settlementMethod === 'account' 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {settlementMethod === 'account' && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      settlementMethod === 'account' 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      Settle with account
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Affects account balance
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Warning for account-linked records choosing simple settlement */}
          {record.account_id && settlementMethod === 'simple' && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> This record was created with an account transaction. Settling without account will mark it as settled but won't reverse the account balance change. Consider using "Settle with account" to maintain accurate account balances.
                </div>
              </div>
            </div>
          )}

          {/* Account Selection */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {getSettlementMessage()}
            </p>
            {/* Show account selection when user selects account settlement method */}
            {settlementMethod === 'account' && (
              <>
            {sortedAccountOptions.length > 0 ? (
              <CustomDropdown
                value={selectedAccountId}
                onChange={(value) => {
                  setSelectedAccountId(value);
                  setErrors({});
                }}
                options={sortedAccountOptions.map(account => ({
                  value: account.id,
                  label: `${account.name} - ${getCurrencySymbol(account.currency)}${account.calculated_balance?.toFixed(2) || '0.00'}`
                }))}
                placeholder="Select account *"
              />
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  No {record.currency} accounts found. Please create a {record.currency} account first to proceed with settlement.
                </p>
              </div>
                )}
              </>
            )}
            {errors.account && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.account}
              </p>
            )}
          </div>


          {/* Settlement Type Selection - Only show when using account settlement method */}
          {settlementMethod === 'account' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Settlement Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`relative flex items-center justify-center p-4 border-2 rounded-lg transition-all duration-300 shadow-sm ${
                hasPartialReturns
                  ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50'
                  : settlementType === 'full' 
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-400 cursor-pointer shadow-md' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer hover:shadow-md'
              }`}>
                <input
                  type="radio"
                  name="settlementType"
                  value="full"
                  checked={settlementType === 'full'}
                  onChange={() => handleSettlementTypeChange('full')}
                  disabled={hasPartialReturns}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className={`w-4 h-4 rounded-full border-2 mx-auto mb-2 ${
                    hasPartialReturns
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600'
                      : settlementType === 'full' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {settlementType === 'full' && !hasPartialReturns && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    hasPartialReturns
                      ? 'text-gray-400 dark:text-gray-500'
                      : settlementType === 'full' 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Full Settlement
                  </span>
                </div>
              </label>
              
              <label className={`relative flex items-center justify-center p-4 border-2 rounded-lg transition-all duration-300 shadow-sm ${
                shouldBeSettled 
                  ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50'
                  : settlementType === 'partial' 
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-400 cursor-pointer shadow-md' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer hover:shadow-md'
              }`}>
                <input
                  type="radio"
                  name="settlementType"
                  value="partial"
                  checked={settlementType === 'partial'}
                  onChange={() => handleSettlementTypeChange('partial')}
                  disabled={shouldBeSettled}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className={`w-4 h-4 rounded-full border-2 mx-auto mb-2 ${
                    shouldBeSettled
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600'
                      : settlementType === 'partial' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {settlementType === 'partial' && !shouldBeSettled && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    shouldBeSettled
                      ? 'text-gray-400 dark:text-gray-500'
                      : settlementType === 'partial' 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {record.type === 'lend' ? 'Partial Return' : 'Partial Payment'}
                  </span>
                </div>
              </label>
            </div>
          </div>
          )}

          {/* Message when full settlement is disabled due to existing partial returns */}
          {hasPartialReturns && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="text-xs text-blue-800 dark:text-blue-200" style={{ fontSize: '0.80rem', lineHeight: '1.2' }}>
                Full settlement is not available because this record already has {record.type === 'lend' ? 'partial returns' : 'partial payments'}. 
                Continue making {record.type === 'lend' ? 'partial returns' : 'partial payments'} until fully {record.type === 'lend' ? 'returned' : 'paid'}.
              </span>
            </div>
          )}

          {/* Message when partial returns are disabled */}
          {shouldBeSettled && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  This record is already fully {record.type === 'lend' ? 'returned' : 'paid'}. No further {record.type === 'lend' ? 'returns' : 'payments'} needed.
                </span>
              </div>
            </div>
          )}

          {/* Partial Return/Payment Amount and Date Input */}
          {settlementType === 'partial' && (
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Return/Payment Amount Input */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-medium">
                    {getCurrencySymbol(record.currency)}
                  </span>
                  <input
                    ref={amountRef}
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingAmount}
                    value={partialAmount || ''}
                    onChange={(e) => setPartialAmount(parseFloat(e.target.value) || 0)}
                    onBlur={handleAmountBlur}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 ${errors.amount && touched.amount ? 'border-red-500 ring-red-200' : 'focus:ring-blue-500'} transition-colors`}
                    placeholder={`Max: ${remainingAmount.toFixed(2)}`}
                  />
                </div>

                {/* Return/Payment Date Input */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-4 pr-[10px] text-[14px] h-10 rounded-lg w-full">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                  <DatePicker
                    selected={returnDate}
                    onChange={(date: Date | null) => setReturnDate(date || new Date())}
                    placeholderText="Return date"
                    dateFormat="yyyy-MM-dd"
                    className="bg-transparent outline-none border-none w-full cursor-pointer text-[14px] text-gray-900 dark:text-gray-100"
                    calendarClassName="z-50 shadow-lg border border-gray-200 dark:border-gray-600 rounded-lg !font-sans"
                    popperPlacement="bottom-start"
                    showPopperArrow={false}
                    wrapperClassName="w-full"
                    todayButton="Today"
                    isClearable
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="ml-2 text-xs text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => setReturnDate(new Date())}
                    tabIndex={-1}
                  >
                    Today
                  </button>
                </div>
              </div>
              
              {/* Error Message */}
              {errors.amount && touched.amount && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.amount}
                </p>
              )}
            </div>
          )}

          {/* Return/Payment History for Partial Returns/Payments */}
          {settlementType === 'partial' && returnHistory.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                {record.type === 'lend' ? 'Return History' : 'Payment History'}
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {returnHistory.map((ret) => (
                  <div key={ret.id} className="text-xs text-gray-600 dark:text-gray-300 flex justify-between">
                    <span>{getCurrencySymbol(record.currency)}{ret.amount.toFixed(2)}</span>
                    <span>{formatDate(ret.return_date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
             <button
               onClick={settlementType === 'full' ? handleFullSettlement : handlePartialReturn}
               className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
               disabled={loading || shouldBeSettled || (hasPartialReturns && settlementType === 'full') || (settlementType === 'partial' && (!!validatePartialAmount() || (settlementMethod === 'account' && !selectedAccountId)))}
             >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {shouldBeSettled 
                ? 'Already Settled'
                : (hasPartialReturns && settlementType === 'full')
                  ? 'Not Available'
                  : settlementType === 'full' 
                ? (record.type === 'lend' ? 'Receive Repayment' : 'Make Payment')
                    : (record.type === 'lend' ? 'Add Return' : 'Add Payment')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};