import React, { useState, useRef } from 'react';
import { X, AlertCircle, Calendar, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { LendBorrow, LendBorrowReturn } from '../../types/index';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Loader } from '../common/Loader';
import { getCurrencySymbol } from '../../utils/currency';

interface PartialReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedRecord: LendBorrow) => void;
  record: LendBorrow;
}

export const PartialReturnModal: React.FC<PartialReturnModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
  record,
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<number>(0);
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [returnHistory, setReturnHistory] = useState<LendBorrowReturn[]>([]);
  const [touched, setTouched] = useState<{ amount?: boolean; returnDate?: boolean }>({});
  const amountRef = useRef<HTMLInputElement | null>(null);

  // Calculate remaining amount
  const totalReturned = returnHistory.reduce((sum, ret) => sum + ret.amount, 0);
  const remainingAmount = record.amount - totalReturned;

  React.useEffect(() => {
    if (isOpen && record.id) {
      fetchReturnHistory();
      setTimeout(() => amountRef.current?.focus(), 100); // Auto-focus
    }
  }, [isOpen, record.id]);

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

  const validate = () => {
    if (amount <= 0) return 'Amount must be greater than 0';
    if (amount > remainingAmount) return `Amount cannot exceed remaining amount (${remainingAmount.toFixed(2)} ${record.currency})`;
    return '';
  };

  const handleBlur = (field: 'amount' | 'returnDate') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setError(validate());
  };

  const handleClearAmount = () => {
    setAmount(0);
    setError('');
    setTouched((prev) => ({ ...prev, amount: false }));
    amountRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ amount: true, returnDate: true });
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Add a small delay to ensure loading animation is visible
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Insert into the returns table
      const { data: returnData, error: returnError } = await supabase
        .from('lend_borrow_returns')
        .insert([{
          lend_borrow_id: record.id,
          amount: amount,
          return_date: returnDate.toISOString(),
        }])
        .select()
        .single();
      if (returnError) {
        setError(returnError.message || 'Failed to record partial return');
        toast.error(returnError.message || 'Failed to record partial return');
        setLoading(false);
        return;
      }
      // Update the main lend_borrow record status if fully paid
      const newTotalReturned = totalReturned + amount;
      const newStatus = newTotalReturned >= record.amount ? 'settled' : 'active';
      const { data, error: updateError } = await supabase
        .from('lend_borrow')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id)
        .select()
        .single();
      if (updateError) {
        console.error('Error updating lend_borrow status:', updateError);
      }
      toast.success(`Partial return of ${amount.toFixed(2)} ${record.currency} recorded successfully!`);
      const updatedRecord = {
        ...record,
        status: newStatus as 'settled' | 'active' | 'overdue',
        updated_at: new Date().toISOString(),
      };
      onUpdated(updatedRecord);
      // Add a small delay before closing to show success state
      await new Promise(resolve => setTimeout(resolve, 300));
      onClose();
      setLoading(false);
      setAmount(0);
      setReturnDate(new Date());
    } catch (error) {
      console.error('Error recording partial return:', error);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
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

  if (!isOpen) return null;

  // Responsive: stack fields vertically on mobile
  const fieldRowClass = 'flex flex-col sm:flex-row gap-2 sm:gap-x-4 sm:items-center';
  const fieldColClass = 'flex-1';
  const today = new Date();

  return (
    <>
      <Loader isLoading={loading} message="Recording partial return..." />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Record Partial Return</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Record Info */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <div><span className="font-medium">Person:</span> {record.person_name}</div>
            <div><span className="font-medium">Original Amount:</span> {formatCurrency(record.amount, record.currency)}</div>
            <div><span className="font-medium">Total Returned:</span> {formatCurrency(totalReturned, record.currency)}</div>
            <div><span className="font-medium">Remaining:</span> {formatCurrency(remainingAmount, record.currency)}</div>
          </div>
        </div>

        {/* Return History */}
        {returnHistory.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Return History</h3>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {returnHistory.map((ret) => (
                <div key={ret.id} className="text-xs text-gray-600 dark:text-gray-300 flex justify-between">
                  <span>{formatCurrency(ret.amount, record.currency)}</span>
                  <span>{formatDate(ret.return_date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Return Amount ({record.currency})
              </label>
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
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  onBlur={() => handleBlur('amount')}
                  className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 ${error && touched.amount ? 'border-red-500 ring-red-200' : 'focus:ring-blue-500'} transition-colors`}
                  placeholder={`Max: ${remainingAmount.toFixed(2)}`}
                  required
                  autoFocus
                />
                {amount > 0 && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    onClick={handleClearAmount}
                    tabIndex={-1}
                    aria-label="Clear amount"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="h-5 mt-1">
                {error && touched.amount && (
                  <p className="text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {error}
                  </p>
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Return Date</label>
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-4 pr-[10px] text-[14px] h-10 rounded-lg w-full">
                <Calendar className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                <DatePicker
                  selected={returnDate}
                  onChange={(date: Date | null) => setReturnDate(date || new Date())}
                  onBlur={() => handleBlur('returnDate')}
                  placeholderText="Return date"
                  dateFormat="yyyy-MM-dd"
                  className="bg-transparent outline-none border-none w-full cursor-pointer text-[14px] text-gray-900 dark:text-gray-100"
                  calendarClassName="z-50 shadow-lg border border-gray-200 dark:border-gray-600 rounded-lg !font-sans"
                  popperPlacement="bottom-start"
                  showPopperArrow={false}
                  wrapperClassName="w-full"
                  todayButton="Today"
                  highlightDates={[today]}
                  isClearable
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="ml-2 text-xs text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => setReturnDate(today)}
                  tabIndex={-1}
                >
                  Today
                </button>
              </div>
              <div className="h-5 mt-1">
                {/* Consistent spacing */}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
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
              className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
              disabled={loading || !!validate()}
            >
              {loading ? 'Saving...' : 'Add Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}; 