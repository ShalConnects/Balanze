import React, { useState, useMemo } from 'react';
import { X, Heart, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CustomDropdown } from '../Purchases/CustomDropdown';
// DatePicker loaded dynamically to reduce initial bundle size
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
import { LazyDatePicker as DatePicker } from '../common/LazyDatePicker';
import { parseISO, format } from 'date-fns';
import { useLoadingContext } from '../../context/LoadingContext';
import { getAllCurrencies, getCurrencyName } from '../../utils/currencies';
import { getCurrencySymbol } from '../../utils/currency';

interface ManualDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualDonationModal: React.FC<ManualDonationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuthStore();
  const { fetchDonationSavingRecords } = useFinanceStore();
  const { isLoading } = useLoadingContext();
  
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [note, setNote] = useState('');
  const [date, setDate] = useState<Date | null>(new Date());

  // Get user profile for selected currencies
  const [profile, setProfile] = useState<any>(null);

  // Fetch user profile on component mount
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('selected_currencies, local_currency')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
          // Set default currency to user's local currency or first selected currency
          if (data.local_currency && data.selected_currencies?.includes(data.local_currency)) {
            setCurrency(data.local_currency);
          } else if (data.selected_currencies && data.selected_currencies.length > 0) {
            setCurrency(data.selected_currencies[0]);
          }
        }
      }
    };
    
    fetchProfile();
  }, [user]);

  // Currency options: use user's selected currencies if available, else show all major currencies
  const allCurrencyOptions = useMemo(() => {
    const allCurrencies = getAllCurrencies();
    return allCurrencies.map(currency => ({
      value: currency,
      label: `${currency} (${getCurrencySymbol(currency)}) - ${getCurrencyName(currency)}`
    }));
  }, []);
  
  const currencyOptions = useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      return allCurrencyOptions.filter(opt => profile.selected_currencies?.includes(opt.value));
    }
    return allCurrencyOptions;
  }, [allCurrencyOptions, profile?.selected_currencies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    





    
    if (!user || isLoading) {

      return;
    }

    const amountNum = parseFloat(amount);

    
    if (!amountNum || amountNum <= 0) {

      toast.error('Please enter a valid amount');
      return;
    }



    try {

      
      // For manual donations, we don't need to link to a specific account
      // since these are external donations not from user's accounts

      // First, ensure we have a 'Donation' category or use a default one
      let categoryName = 'Donation';
      

      
      // Check if 'Donation' category exists, if not use 'Income' as fallback
      const { data: categories } = await supabase
        .from('categories')
        .select('name')
        .eq('user_id', user.id)
        .eq('name', 'Donation')
        .limit(1);
      

      
      if (!categories || categories.length === 0) {

        // Use 'Income' as fallback category
        const { data: incomeCategories } = await supabase
          .from('categories')
          .select('name')
          .eq('user_id', user.id)
          .eq('type', 'income')
          .limit(1);
        

        
        if (incomeCategories && incomeCategories.length > 0) {
          categoryName = incomeCategories[0].name;

        }
      }
      


      // Create the donation record directly without a transaction
      const donationData = {
        user_id: user.id,
        transaction_id: null, // No transaction for manual donations
        custom_transaction_id: `MD${Date.now().toString().slice(-6)}`,
        type: 'donation',
        amount: amountNum,
        mode: 'fixed',
        mode_value: amountNum,
        note: note ? `${note} Currency: ${currency}` : `Currency: ${currency}`,
        status: 'donated', // Manual donations are marked as donated by default
        created_at: new Date().toISOString().split('T')[0] // Always use current date for created_at
      };
      

      
      const { data: donationRecord, error: donationError } = await supabase
        .from('donation_saving_records')
        .insert(donationData)
        .select()
        .single();

      if (donationError) {

        throw donationError;
      }
      


      toast.success('Manual donation recorded successfully!');
      

      
      // Small delay to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 500));
      

      // Refresh all related data
      await fetchDonationSavingRecords();
      

      // Also refresh transactions since the donations page depends on them
      const store = useFinanceStore.getState();
      await store.fetchTransactions();
      

      
      onClose();
      
      // Reset form
      setAmount('');
      // Reset to user's preferred currency
      if (profile?.local_currency && profile.selected_currencies?.includes(profile.local_currency)) {
        setCurrency(profile.local_currency);
      } else if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
        setCurrency(profile.selected_currencies[0]);
      } else {
        setCurrency('USD');
      }
      setNote('');
      setDate(new Date());
    } catch (error: any) {


      
      // More specific error messages
      if (error.message?.includes('foreign key')) {
        toast.error('Database constraint error. Please check your account setup.');
      } else if (error.message?.includes('duplicate')) {
        toast.error('A donation with this ID already exists. Please try again.');
      } else if (error.message?.includes('category')) {
        toast.error('Category not found. Please check your categories setup.');
      } else {
        toast.error(`Failed to record manual donation: ${error.message || 'Unknown error'}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-green-700" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add Manual Donation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount and Currency */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Donation Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <CustomDropdown
                value={currency}
                onChange={(value: string) => setCurrency(value)}
                options={currencyOptions}
                placeholder="Select currency"
                fullWidth={true}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Donation Date
            </label>
            <div className="relative">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-4 pr-[10px] text-[14px] h-10 rounded-lg w-full border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <DatePicker
                  selected={date}
                  onChange={(date) => setDate(date)}
                  placeholderText="Select date"
                  dateFormat="yyyy-MM-dd"
                  className="bg-transparent outline-none border-none w-full cursor-pointer text-[14px] text-gray-900 dark:text-white"
                  calendarClassName="z-50 shadow-lg border border-gray-200 rounded-lg !font-sans"
                  popperPlacement="bottom-start"
                  showPopperArrow={false}
                  wrapperClassName="w-full"
                  todayButton="Today"
                  highlightDates={[new Date()]}
                  isClearable
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="ml-2 text-xs text-blue-600 hover:underline"
                  onClick={() => setDate(new Date())}
                  tabIndex={-1}
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this donation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-green-700 hover:bg-green-800 disabled:bg-green-600 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Heart className="w-4 h-4 mr-2" />
              )}
              Record Donation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 

