import React, { useState, useEffect } from 'react';
import { Plus, Wallet, CreditCard, ArrowLeftRight, ShoppingCart, Handshake } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Dialog, Transition } from '@headlessui/react';
import { TransferModal } from '../Transfers/TransferModal';
import { DPSTransferModal } from '../Transfers/DPSTransferModal';
import { AccountForm } from '../Accounts/AccountForm';
import { TransactionForm } from '../Transactions/TransactionForm';

import { LendBorrowForm } from '../LendBorrow/LendBorrowForm';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PurchaseForm } from '../Purchases/PurchaseForm';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LendBorrowInput } from '../../types/index';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useMobileSidebar } from '../../context/MobileSidebarContext';

// Define the props for our new ActionButton component.
interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color: string;
  delay: string;
}

// A single action button used in the speed dial.
const ActionButton: React.FC<ActionButtonProps> = ({ icon: Icon, label, onClick, color, delay }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full group focus:outline-none"
      style={{ transitionDelay: delay }}
      title={label}
    >
      <span className={`${color} text-white p-2.5 rounded-full shadow-md flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="w-5 h-5" />
      </span>
      <span
        className="px-4 py-2 rounded-lg text-sm font-medium shadow-sm border border-gray-700 transition-colors w-44 min-w-44 text-left flex-shrink-0 group-hover:bg-white/10 dark:group-hover:bg-gray-100/10 duration-150"
        style={{ background: '#4c54618f', color: 'white' }}
      >
        {label}
      </span>
    </button>
  );
};

export const FloatingActionButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAccountForm, setShowAccountFormLocal] = useState(false);
  const [showTransferTypeModal, setShowTransferTypeModal] = useState(false);
  const [showCurrencyTransferModal, setShowCurrencyTransferModal] = useState(false);
  const [showDpsTransferModal, setShowDpsTransferModal] = useState(false);
  const [showInBetweenTransferModal, setShowInBetweenTransferModal] = useState(false);
  const [showLendBorrowForm, setShowLendBorrowForm] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const { isMobile } = useMobileDetection();
  const { isMobileSidebarOpen } = useMobileSidebar();
  const { 
    setShowTransactionForm, 
    showTransactionForm, 
    setShowPurchaseForm, 
    showPurchaseForm,
    addLendBorrowRecord
  } = useFinanceStore();
  
  // Memoize categories to prevent infinite re-renders
  const categories = useFinanceStore(React.useCallback(state => state.categories, []));
  const purchaseCategories = useFinanceStore(React.useCallback(state => state.purchaseCategories, []));
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Check if categories exist and redirect to settings if needed - memoized to prevent infinite re-renders
  const checkCategoriesAndRedirect = React.useCallback((type: 'transaction' | 'purchase') => {
    console.log('checkCategoriesAndRedirect called with type:', type);
    console.log('categories:', categories);
    console.log('purchaseCategories:', purchaseCategories);
    
    const hasIncomeCategories = categories.filter(cat => cat.type === 'income').length > 0;
    const hasExpenseCategories = purchaseCategories.length > 0; // Use purchaseCategories since transaction form now uses them
    
    console.log('hasIncomeCategories:', hasIncomeCategories);
    console.log('hasExpenseCategories:', hasExpenseCategories);
    
    if (type === 'transaction') {
      if (!hasIncomeCategories || !hasExpenseCategories) {
        console.log('Categories check failed - showing error toast');
        toast.error('Please add categories first before creating transactions', {
          description: 'You need both income and expense categories to create transactions.',
          action: {
            label: 'Go to Settings',
            onClick: () => navigate('/settings?tab=income-category')
          }
        });
        return false;
      }
    } else if (type === 'purchase') {
      if (!hasExpenseCategories) {
        console.log('Purchase categories check failed - showing error toast');
        toast.error('Please add expense categories first before creating purchases', {
          description: 'You need expense categories to create purchases.',
          action: {
            label: 'Go to Settings',
            onClick: () => navigate('/settings?tab=expense-category')
          }
        });
        return false;
      }
    }
    console.log('Categories check passed - returning true');
    return true;
  }, [categories, purchaseCategories, navigate]);

  const handleAction = React.useCallback((action: () => void) => {
    action();
    setIsOpen(false);
  }, []);

  const handleAddTransaction = React.useCallback(() => {
    console.log('handleAddTransaction called');
    if (checkCategoriesAndRedirect('transaction')) {
      console.log('Setting showTransactionForm to true');
      setShowTransactionForm(true);
      console.log('showTransactionForm set to true');
    }
  }, [checkCategoriesAndRedirect, setShowTransactionForm]);

  const handleAddPurchase = React.useCallback(() => {
    if (checkCategoriesAndRedirect('purchase')) {
      setShowPurchaseForm(true);
    }
  }, [checkCategoriesAndRedirect, setShowPurchaseForm]);

  const handleTransfer = React.useCallback(() => {
    setShowTransferTypeModal(true);
    setIsOpen(false);
  }, [setShowTransferTypeModal]);

  const handleSelectTransferType = React.useCallback((type: 'currency' | 'dps' | 'inbetween') => {
    setShowTransferTypeModal(false);
    if (type === 'currency') {
      setShowCurrencyTransferModal(true);
    } else if (type === 'dps') {
      setShowDpsTransferModal(true);
    } else if (type === 'inbetween') {
      setShowInBetweenTransferModal(true);
    }
  }, [setShowTransferTypeModal, setShowCurrencyTransferModal, setShowDpsTransferModal, setShowInBetweenTransferModal]);

  const handleAddLendBorrowRecord = React.useCallback(async (record: any) => {
    try {
      await addLendBorrowRecord(record);
    } catch (error) {
      console.error('Error adding lend/borrow record:', error);
      toast.error('Failed to add record. Please try again.');
    }
  }, [addLendBorrowRecord]);

  const actions = React.useMemo(() => [
    { label: t('dashboard.addTransaction'), icon: CreditCard, color: 'bg-blue-600', onClick: () => handleAction(handleAddTransaction), delay: '200ms' },
    { label: 'Add Purchase', icon: ShoppingCart, color: 'bg-orange-600', onClick: () => handleAction(handleAddPurchase), delay: '150ms' },
    { label: 'Lent & Borrow', icon: Handshake, color: 'bg-indigo-600', onClick: () => handleAction(() => setShowLendBorrowForm(true)), delay: '100ms' },
    { label: t('dashboard.addAccount'), icon: Wallet, color: 'bg-green-600', onClick: () => handleAction(() => setShowAccountFormLocal(true)), delay: '50ms' },
    { label: t('dashboard.transfer'), icon: ArrowLeftRight, color: 'bg-purple-600', onClick: handleTransfer, delay: '0ms' },
  ], [t, handleAction, handleAddTransaction, handleAddPurchase, setShowLendBorrowForm, setShowAccountFormLocal, handleTransfer]);



  // Load purchase categories when component mounts
  useEffect(() => {
    if (user && purchaseCategories.length === 0) {
      useFinanceStore.getState().fetchPurchaseCategories();
    }
  }, [user, purchaseCategories.length]);

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle quick button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show tip only for 5 seconds after page refresh (first load)
  useEffect(() => {
    if (showTip) {
      const timer = setTimeout(() => setShowTip(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showTip]);

  return (
    <>
      <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end ${isMobile && isMobileSidebarOpen ? 'hidden' : ''}`}>
        <div className="relative flex flex-col items-end">
          {/* Animated Menu Items - now absolutely positioned above the FAB */}
          <Transition
            show={isOpen}
            enter="transition-all ease-in-out duration-200"
            enterFrom="opacity-0 translate-y-4"
            enterTo="opacity-100 translate-y-0"
            leave="transition-all ease-in-out duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-4"
          >
            <div className="absolute bottom-full right-0 mb-4 p-4 rounded-2xl shadow-2xl flex flex-col gap-2 min-w-[220px] z-50 bg-gradient-primary">
              {actions.map((action) => (
                <ActionButton key={action.label} {...action} />
              ))}
            </div>
          </Transition>
          {/* Helper Tip - now left of the button, no background */}
          <div className="flex items-center">
            {!isOpen && showTip && (
              <span className="mr-2 text-xs text-white bg-gray-800/95 border-2 border-blue-400 px-4 py-2 rounded-lg animate-fade-in z-[100] shadow-lg">
                Tip: Press <b>Ctrl+B</b> (or <b>Cmd+B</b>) to toggle quick actions
                <button onClick={() => setShowTip(false)} className="ml-2 text-gray-300 hover:text-white p-1 rounded transition-colors" aria-label="Dismiss tip">×</button>
              </span>
            )}
            {/* Main FAB Button */}
            <button
              data-tour="quick-actions"
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-3.5 rounded-full shadow-lg bg-gradient-primary hover:bg-gradient-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus-ring-gradient"
              aria-label={isOpen ? 'Close actions' : 'Open actions'}
            >
              <Plus className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-45' : 'rotate-0'}`} />
            </button>
          </div>
        </div>
      </div>
      {/* Transfer Type Selection Modal */}
      <Dialog open={showTransferTypeModal} onClose={() => setShowTransferTypeModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-xs rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              {t('dashboard.selectTransferType')}
            </Dialog.Title>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleSelectTransferType('currency')}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-left"
              >
                <div className="font-medium">{t('dashboard.currencyTransfer')}</div>
                <div className="text-sm opacity-90">{t('dashboard.currencyTransferDescription')}</div>
              </button>
              <button
                onClick={() => handleSelectTransferType('dps')}
                className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-left"
              >
                <div className="font-medium">{t('dashboard.dpsTransfer')}</div>
                <div className="text-sm opacity-90">{t('dashboard.dpsTransferDescription')}</div>
              </button>
              <button
                onClick={() => handleSelectTransferType('inbetween')}
                className="bg-gray-200 text-gray-900 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors text-left"
              >
                <div className="font-medium">In-between Transfer</div>
                <div className="text-sm opacity-90">Transfer between accounts within the same currency</div>
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modals */}
      {showAccountForm && <AccountForm isOpen={showAccountForm} onClose={() => setShowAccountFormLocal(false)} />}
      {showCurrencyTransferModal && <TransferModal isOpen={showCurrencyTransferModal} onClose={() => setShowCurrencyTransferModal(false)} mode="currency" />}
      {showDpsTransferModal && <DPSTransferModal isOpen={showDpsTransferModal} onClose={() => setShowDpsTransferModal(false)} />}
      {showInBetweenTransferModal && <TransferModal isOpen={showInBetweenTransferModal} onClose={() => setShowInBetweenTransferModal(false)} mode="inbetween" />}
      <TransactionForm isOpen={showTransactionForm} onClose={() => setShowTransactionForm(false)} />
      <PurchaseForm isOpen={showPurchaseForm} onClose={() => setShowPurchaseForm(false)} />

      {showLendBorrowForm && (
        <LendBorrowForm 
          onClose={() => setShowLendBorrowForm(false)} 
          onSubmit={handleAddLendBorrowRecord}
        />
      )}
    </>
  );
}; 