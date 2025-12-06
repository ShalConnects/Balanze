import { create } from 'zustand';
import { Account, Transaction, Category, Budget, DashboardStats, SavingsGoal, Purchase, PurchaseCategory, PurchaseAnalytics, MultiCurrencyPurchaseAnalytics, PurchaseAttachment, LendBorrowAnalytics, LendBorrow } from '../types';
import { DonationSavingRecord, DonationSavingAnalytics, PaymentTransaction, PaymentHistoryStats } from '../types/index';
import { 
  InvestmentAsset, 
  InvestmentTransaction, 
  InvestmentCategory, 
  InvestmentGoal, 
  InvestmentAnalytics,
  InvestmentDashboardStats,
  InvestmentAssetInput,
  InvestmentTransactionInput,
  InvestmentCategoryInput,
  InvestmentGoalInput
} from '../types/investment';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { showToast } from '../lib/toast';
import { createNotification } from '../lib/notifications';
import { logTransactionEvent, createAuditLog } from '../lib/auditLogging';

// Utility function to get local time in ISO format
function getLocalISOString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localTime = new Date(now.getTime() - (offset * 60000));
  return localTime.toISOString();
}
import { generateTransactionId } from '../utils/transactionId';
import { useAchievementStore } from './achievementStore';
import { userActivityService } from '../lib/userActivityService';
import { isLendBorrowTransaction } from '../utils/transactionUtils';

// Extend the Account type to make calculated_balance optional for input
type AccountInput = Omit<Account, 'calculated_balance'>;

interface FinanceStore {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  purchases: Purchase[];
  purchaseCategories: PurchaseCategory[];
  lendBorrowRecords: LendBorrow[];
  loading: boolean;
  error: string | null;
  globalSearchTerm: string;
  showTransactionForm: boolean;
  showAccountForm: boolean;
  showTransferModal: boolean;
  showPurchaseForm: boolean;
  donationSavingRecords: DonationSavingRecord[];
  
  // Investment Management
  investmentAssets: InvestmentAsset[];
  investmentTransactions: InvestmentTransaction[];
  investmentCategories: InvestmentCategory[];
  investmentGoals: InvestmentGoal[];
  showInvestmentAssetForm: boolean;
  showInvestmentTransactionForm: boolean;
  showInvestmentGoalForm: boolean;
  setDonationSavingRecords: (records: DonationSavingRecord[] | ((prev: DonationSavingRecord[]) => DonationSavingRecord[])) => void;
  
  // Payment History
  paymentTransactions: PaymentTransaction[];
  setPaymentTransactions: (transactions: PaymentTransaction[] | ((prev: PaymentTransaction[]) => PaymentTransaction[])) => void;

  // Upgrade Modal State
  upgradeModal: {
    isOpen: boolean;
    type: 'limit' | 'feature';
    feature?: string;
    currentUsage?: {
      current: number;
      limit: number;
      type: string;
    };
  };
  openUpgradeModal: (type: 'limit' | 'feature', feature?: string, currentUsage?: { current: number; limit: number; type: string }) => void;
  closeUpgradeModal: () => void;

  fetchAccounts: () => Promise<void>;
  addAccount: (account: Omit<AccountInput, 'id' | 'user_id' | 'created_at'> & { dps_initial_balance?: number, transaction_id?: string }) => Promise<void>;
  updateAccount: (id: string, updates: Partial<AccountInput> & { dps_initial_balance?: number }) => Promise<void>;
  updateAccountPosition: (accountId: string, newPosition: number) => Promise<void>;
  deleteAccount: (id: string, transaction_id?: string) => Promise<void>;
  
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'> & { transaction_id?: string }, purchaseDetails?: {
    priority: 'low' | 'medium' | 'high';
    notes: string;
    attachments: PurchaseAttachment[];
  }) => Promise<{ id: string; transaction_id: string } | undefined>;
  updateTransaction: (id: string, transaction: Partial<Transaction>, purchaseDetails?: {
    priority: 'low' | 'medium' | 'high';
    notes: string;
    attachments: PurchaseAttachment[];
  }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  fetchCategories: (currency?: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Purchase Management
  fetchPurchases: () => Promise<void>;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  bulkUpdatePurchases: (ids: string[], updates: Partial<Purchase>) => Promise<void>;
  
  // Purchase Attachments
  uploadPurchaseAttachment: (purchaseId: string, file: File) => Promise<void>;
  fetchPurchaseAttachments: (purchaseId: string) => Promise<PurchaseAttachment[]>;
  deletePurchaseAttachment: (attachmentId: string) => Promise<void>;
  
  fetchPurchaseCategories: () => Promise<void>;
  addPurchaseCategory: (category: Omit<PurchaseCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePurchaseCategory: (id: string, category: Partial<PurchaseCategory>) => Promise<void>;
  deletePurchaseCategory: (id: string) => Promise<void>;
  fetchAllData: () => Promise<void>;
  
  getPurchaseAnalytics: () => PurchaseAnalytics;
  getMultiCurrencyPurchaseAnalytics: () => MultiCurrencyPurchaseAnalytics;
  getPurchasesByCategory: (category: string) => Purchase[];
  getPurchasesByStatus: (status: Purchase['status']) => Purchase[];
  
  getDashboardStats: () => DashboardStats;
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getTransactionsByCategory: (category: string) => Transaction[];

  setGlobalSearchTerm: (term: string) => void;
  setShowTransactionForm: (show: boolean) => void;
  setShowAccountForm: (show: boolean) => void;
  setShowTransferModal: (show: boolean) => void;
  setShowPurchaseForm: (show: boolean) => void;
  
  // Investment Management Methods
  setShowInvestmentAssetForm: (show: boolean) => void;
  setShowInvestmentTransactionForm: (show: boolean) => void;
  setShowInvestmentGoalForm: (show: boolean) => void;
  
  // Investment Assets
  fetchInvestmentAssets: () => Promise<void>;
  addInvestmentAsset: (asset: InvestmentAssetInput) => Promise<void>;
  updateInvestmentAsset: (id: string, asset: Partial<InvestmentAssetInput>) => Promise<void>;
  deleteInvestmentAsset: (id: string) => Promise<void>;
  
  // Investment Transactions
  fetchInvestmentTransactions: () => Promise<void>;
  addInvestmentTransaction: (transaction: InvestmentTransactionInput) => Promise<void>;
  updateInvestmentTransaction: (id: string, transaction: Partial<InvestmentTransactionInput>) => Promise<void>;
  deleteInvestmentTransaction: (id: string) => Promise<void>;
  
  // Investment Categories
  fetchInvestmentCategories: () => Promise<void>;
  addInvestmentCategory: (category: InvestmentCategoryInput) => Promise<void>;
  updateInvestmentCategory: (id: string, category: Partial<InvestmentCategoryInput>) => Promise<void>;
  deleteInvestmentCategory: (id: string) => Promise<void>;
  
  // Investment Goals
  fetchInvestmentGoals: () => Promise<void>;
  addInvestmentGoal: (goal: InvestmentGoalInput) => Promise<void>;
  updateInvestmentGoal: (id: string, goal: Partial<InvestmentGoalInput>) => Promise<void>;
  deleteInvestmentGoal: (id: string) => Promise<void>;
  
  // Investment Analytics
  getInvestmentAnalytics: () => InvestmentAnalytics;
  getInvestmentDashboardStats: () => InvestmentDashboardStats;

  getActiveAccounts: () => Account[];
  getActiveTransactions: () => Transaction[];

  transfer: (params: {
    from_account_id: string,
    to_account_id: string,
    from_amount: number,
    exchange_rate: number,
    note?: string,
    transaction_id?: string
  }) => Promise<void>;

  fetchSavingsGoals: () => Promise<void>;
  createSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'created_at' | 'current_amount'>) => Promise<void>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;

  saveSavingsGoal: (goalId: string, amount: number) => Promise<void>;

  transferDPS: (params: {
    from_account_id: string,
    amount: number,
    transaction_id?: string
  }) => Promise<void>;

  getCategories: () => Category[];

  syncExpenseCategoriesWithPurchaseCategories: () => Promise<void>;
  clearDeletedCategoriesList: () => void;

  // Donation & Savings Management
  fetchDonationSavingRecords: () => Promise<void>;
  getDonationSavingAnalytics: () => DonationSavingAnalytics;
  getDonationSavingRecordsByType: (type: 'saving' | 'donation') => DonationSavingRecord[];
  getDonationSavingRecordsByMonth: (month: string) => DonationSavingRecord[];
  deleteDonationSavingRecord: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Lend & Borrow Analytics
  getLendBorrowAnalytics: () => LendBorrowAnalytics;

  // Lend & Borrow Management
  fetchLendBorrowRecords: () => Promise<void>;
  addLendBorrowRecord: (record: any) => Promise<void>;
  updateLendBorrowRecord: (id: string, updates: Partial<LendBorrow>) => Promise<void>;
  deleteLendBorrowRecord: (id: string) => Promise<void>;
  
  // Payment History Management
  fetchPaymentTransactions: () => Promise<void>;
  getPaymentHistoryStats: () => PaymentHistoryStats;
}

const defaultCategories: Category[] = [
  // Income categories
  { id: '1', name: 'Salary', type: 'income', color: '#10B981', icon: 'Banknote' },
  { id: '2', name: 'Freelance', type: 'income', color: '#3B82F6', icon: 'Laptop' },
  { id: '3', name: 'Investment', type: 'income', color: '#8B5CF6', icon: 'TrendingUp' },
  
  // Regular expense categories (for bills, services, etc.)
  { id: '4', name: 'Bills & Utilities', type: 'expense', color: '#6366F1', icon: 'Receipt' },
  { id: '5', name: 'Rent & Housing', type: 'expense', color: '#F59E0B', icon: 'Home' },
  { id: '6', name: 'Transportation', type: 'expense', color: '#EF4444', icon: 'Car' },
  { id: '7', name: 'Healthcare', type: 'expense', color: '#EC4899', icon: 'Heart' },
  { id: '8', name: 'Insurance', type: 'expense', color: '#14B8A6', icon: 'Shield' },
  { id: '9', name: 'Subscriptions', type: 'expense', color: '#8B5CF6', icon: 'Repeat' },
  { id: '10', name: 'Entertainment', type: 'expense', color: '#F97316', icon: 'Film' },
  { id: '11', name: 'Donations', type: 'expense', color: '#10B981', icon: 'Gift' },
  
  // Purchase categories (for buying goods)
  { id: '12', name: 'Food & Dining', type: 'expense', color: '#F59E0B', icon: 'UtensilsCrossed' },
  { id: '13', name: 'Shopping', type: 'expense', color: '#EC4899', icon: 'ShoppingBag' },
];

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  accounts: [],
  transactions: [],
  categories: [],
  budgets: [],
  savingsGoals: [],
  purchases: [],
  purchaseCategories: [],
  lendBorrowRecords: [],
  loading: false,
  error: null,
  globalSearchTerm: '',
  showTransactionForm: false,
  showAccountForm: false,
  showTransferModal: false,
  showPurchaseForm: false,
  donationSavingRecords: [],
  
  // Investment Management State
  investmentAssets: [],
  investmentTransactions: [],
  investmentCategories: [],
  investmentGoals: [],
  showInvestmentAssetForm: false,
  showInvestmentTransactionForm: false,
  showInvestmentGoalForm: false,
  setDonationSavingRecords: (records) => {
    set((state) => ({
      donationSavingRecords: typeof records === 'function' ? records(state.donationSavingRecords) : records
    }));
  },
  
  // Payment History
  paymentTransactions: [],
  setPaymentTransactions: (transactions) => {
    set((state) => ({
      paymentTransactions: typeof transactions === 'function' ? transactions(state.paymentTransactions) : transactions
    }));
  },

  // Upgrade Modal State
  upgradeModal: {
    isOpen: false,
    type: 'limit',
    feature: '',
    currentUsage: {
      current: 0,
      limit: 0,
      type: '',
    },
  },
  openUpgradeModal: (type, feature, currentUsage) => {
    set({ upgradeModal: { isOpen: true, type, feature, currentUsage } });
  },
  closeUpgradeModal: () => set({ upgradeModal: { isOpen: false, type: 'limit', feature: '', currentUsage: { current: 0, limit: 0, type: '' } } }),

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) {
      return set({ loading: false, error: 'Not authenticated' });
    }
    
    try {
      // Use account_balances view instead of accounts table to get calculated balances
      // Added limit to prevent large data fetches
      const { data, error } = await supabase
        .from('account_balances')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(50); // Limit to 50 accounts max

      if (error) {
        return set({ loading: false, error: error.message });
      }


    // Do not filter out DPS savings accounts; include all accounts
    // When mapping from db, map is_active to isActive
    const accounts = data.map(account => ({
      ...account,
      id: account.account_id, // Use account_id from the view
      isActive: account.is_active, // Map db to frontend
      calculated_balance: Number(account.calculated_balance) || 0,
      initial_balance: Number(account.initial_balance) || 0,
      has_dps: Boolean(account.has_dps),
      dps_type: account.dps_type,
      dps_amount_type: account.dps_amount_type,
      dps_fixed_amount: account.dps_fixed_amount ? Number(account.dps_fixed_amount) : null,
      dps_savings_account_id: account.dps_savings_account_id,
      donation_preference: account.donation_preference ? Number(account.donation_preference) : null,
      position: account.position || 0,
    }));


    set({ accounts, loading: false });
    
    // Mock data (commented out):
    // const mockAccounts = [...];
    // set({ accounts: mockAccounts, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
    }
  },

  addAccount: async (account: Omit<AccountInput, 'id' | 'user_id' | 'created_at'> & { dps_initial_balance?: number, transaction_id?: string }) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      // Calculate DPS initial balance
      const dpsInitial = account.dps_initial_balance || 0;
      const mainInitial = account.initial_balance;
      
      // Remove dps_initial_balance from main account object
      const { dps_initial_balance, transaction_id, ...mainAccountData } = account;
      // Map isActive to is_active for Supabase
      if ('isActive' in mainAccountData) {
        (mainAccountData as any).is_active = (mainAccountData as any).isActive;
        delete (mainAccountData as any).isActive;
      }
      
      // First create the main account (do not deduct DPS initial)
      const { data: mainAccount, error: mainError } = await supabase
        .from('accounts')
        .insert([{
          ...mainAccountData,
          user_id: user.id,
          is_active: true,
          has_dps: account.has_dps || false,
          dps_type: account.has_dps ? account.dps_type : null,
          dps_amount_type: account.has_dps ? account.dps_amount_type : null,
          dps_fixed_amount: account.has_dps && account.dps_amount_type === 'fixed' ? account.dps_fixed_amount : null,
          transaction_id: transaction_id || null
        }])
        .select()
        .single();

      if (mainError) throw mainError;

      // Audit log for account creation
      if (mainAccount) {
        await supabase.from('activity_history').insert({
          user_id: user.id,
          activity_type: 'ACCOUNT_CREATED',
          entity_type: 'account',
          entity_id: mainAccount.id,
          description: `New account created: ${mainAccount.name} (${mainAccount.currency})`,
          changes: {
            new: mainAccount
          }
        });
      }
      // If this is a DPS account, create a linked savings account
      if (account.has_dps) {
        
        const { data: savingsAccount, error: savingsError } = await supabase
          .from('accounts')
          .insert([{
            name: `${account.name} (DPS)`,
            type: 'savings',
            initial_balance: dpsInitial,
            currency: account.currency,
            user_id: user.id,
            is_active: true,
            description: `DPS account for ${account.name}`
          }])
          .select()
          .single();

        if (savingsError) throw savingsError;

        // Update the main account with the savings account ID
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ dps_savings_account_id: savingsAccount.id })
          .eq('id', mainAccount.id);

        if (updateError) throw updateError;
      }

      // Check if user already has a cash account, if not create one
      const currentAccounts = get().accounts;
      const hasCashAccount = currentAccounts.some(acc => acc.type === 'cash');
      
      if (!hasCashAccount) {
        const { data: cashAccount, error: cashError } = await supabase
          .from('accounts')
          .insert([{
            name: 'Cash Wallet',
            type: 'cash',
            initial_balance: 0,
            calculated_balance: 0,
            currency: account.currency, // Use same currency as the new account
            description: 'Default cash account for tracking physical money',
            has_dps: false,
            dps_type: null,
            dps_amount_type: null,
            dps_fixed_amount: null,
            is_active: true,
            user_id: user.id
          }])
          .select()
          .single();

        if (cashError) {
          // Don't fail the main account creation if cash account fails
        } else {
          
          // Audit log for cash account creation
          await supabase.from('activity_history').insert({
            user_id: user.id,
            activity_type: 'ACCOUNT_CREATED',
            entity_type: 'account',
            entity_id: cashAccount.id,
            description: `Default cash account created: ${cashAccount.name} (${cashAccount.currency})`,
            changes: {
              new: cashAccount
            }
          });
        }
      }

      // Only fetch accounts on success
      await get().fetchAccounts();
      
      // Track account creation activity
      await userActivityService.trackAccountCreated(user.id, { accountType: account.type });
      
      // Trigger achievement check for account creation
      const { checkAndAwardAchievements } = useAchievementStore.getState();
      checkAndAwardAchievements('create_account', { accountType: account.type });
      
      set({ loading: false });
    } catch (err: any) {
      // Re-throw plan-related errors so they can be handled by the UI
      if (err.message && (
        err.message.includes('ACCOUNT_LIMIT_EXCEEDED') ||
        err.message.includes('CURRENCY_LIMIT_EXCEEDED') ||
        err.message.includes('TRANSACTION_LIMIT_EXCEEDED') ||
        err.message.includes('MONTHLY_TRANSACTION_LIMIT_EXCEEDED') ||
        err.message.includes('FEATURE_NOT_AVAILABLE')
      )) {
        set({ loading: false }); // Reset loading state before re-throwing
        throw err; // Re-throw plan-related errors
      }
      
      set({ error: err.message || 'Failed to add account', loading: false });
    }
  },
  
  updateAccount: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      // Get the current account state
      const currentAccount = get().accounts.find(a => a.id === id);
      if (!currentAccount) throw new Error('Account not found');

      // Remove dps_initial_balance from updates if it exists
      let dbUpdates = updates;
      let dps_initial_balance = 0;
      if ('dps_initial_balance' in updates) {
        const { dps_initial_balance: dpsInit, ...rest } = updates as any;
        dbUpdates = rest;
        dps_initial_balance = dpsInit;
        // DPS update debug info removed
      }
      // Use is_active for Supabase update
      const supabaseUpdates: any = { ...dbUpdates };
      if (typeof updates.isActive !== 'undefined') {
        supabaseUpdates.is_active = updates.isActive;
        delete supabaseUpdates.isActive;
      }
      
      // Set DPS fields on supabaseUpdates
      supabaseUpdates.has_dps = updates.has_dps || false;
      supabaseUpdates.dps_type = updates.has_dps ? updates.dps_type : null;
      supabaseUpdates.dps_amount_type = updates.has_dps ? updates.dps_amount_type : null;
      supabaseUpdates.dps_fixed_amount = updates.has_dps && updates.dps_amount_type === 'fixed' ? updates.dps_fixed_amount : null;
      
      // Remove isActive from supabaseUpdates if it exists (it should be is_active now)
      delete supabaseUpdates.isActive;



      // If DPS is being enabled and there's no savings account linked
      if (updates.has_dps && !currentAccount.has_dps) {
        console.log('Enabling DPS on existing account:', {
          accountName: currentAccount.name,
          dps_initial_balance,
          currency: currentAccount.currency
        });
        
        // Check if a DPS savings account already exists
        if (currentAccount.dps_savings_account_id) {
          // Updating existing DPS savings account
          
          // Delete all transactions for the DPS savings account
          await supabase
            .from('transactions')
            .delete()
            .eq('account_id', currentAccount.dps_savings_account_id);
          
          // Update the existing DPS savings account's initial_balance
          const { data: updatedDpsAccount, error: dpsUpdateError } = await supabase
            .from('accounts')
            .update({ initial_balance: dps_initial_balance, updated_at: getLocalISOString() })
            .eq('id', currentAccount.dps_savings_account_id)
            .select()
            .single();
          
          // DPS savings account update completed
          supabaseUpdates.dps_savings_account_id = currentAccount.dps_savings_account_id;
        } else {
          // Create a linked savings account with the correct initial_balance
          // Creating new DPS savings account for existing account
          
          const { data: savingsAccount, error: savingsError } = await supabase
            .from('accounts')
            .insert([{
              name: `${currentAccount.name} (DPS)`,
              type: 'savings',
              initial_balance: dps_initial_balance,
              currency: currentAccount.currency,
              user_id: user.id,
              is_active: true,
              description: `DPS account for ${currentAccount.name}`
            }])
            .select()
            .single();

          // DPS savings account creation completed
          if (savingsError) throw savingsError;

          // Add the savings account ID to the updates
          supabaseUpdates.dps_savings_account_id = savingsAccount.id;
        }
      }

      // Update the account
      const { error } = await supabase
        .from('accounts')
        .update(supabaseUpdates as any)
        .eq('id', id);

      if (error) throw error;
      await get().fetchAccounts();
      // Debug log after fetch
      // Accounts updated after DPS changes
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to update account', loading: false });
      throw err;
    }
  },

  updateAccountPosition: async (accountId: string, newPosition: number) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      // Update the account position in the database
      const { error } = await supabase
        .from('accounts')
        .update({ position: newPosition })
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state immediately for better UX
      set((state) => ({
        accounts: state.accounts.map(account => 
          account.id === accountId 
            ? { ...account, position: newPosition }
            : account
        ),
        loading: false
      }));

    } catch (err: any) {
      set({ error: err.message || 'Failed to update account position', loading: false });
      throw err;
    }
  },
  
  deleteAccount: async (id, transaction_id) => {
    set({ loading: true, error: null });
    // Remove references from main accounts
    await supabase.from('accounts').update({ dps_savings_account_id: null }).eq('dps_savings_account_id', id);
    // Delete all dps_transfers referencing this account
    await supabase.from('dps_transfers').delete().or(`to_account_id.eq.${id},from_account_id.eq.${id}`);
    // Now delete the account
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) {
      set({ loading: false, error: error.message });
      if (transaction_id) showToast.error(`Account deletion failed (Transaction ID: ${transaction_id.slice(0,8)})`);
      return;
    }
    if (transaction_id) showToast.success(`Account deleted (Transaction ID: ${transaction_id.slice(0,8)})`);
    await get().fetchAccounts();
    set({ loading: false });
  },

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) {
      return set({ loading: false, error: 'Not authenticated' });
    }

    try {
      // Optimized query with limit and specific date range for better performance
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1000); // Limit to 1000 most recent transactions
      
      if (error) {
        return set({ loading: false, error: error.message });
      }

      set({ transactions: data || [], loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
    }
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'created_at'> & { transaction_id?: string }, purchaseDetails?: {
    priority: 'low' | 'medium' | 'high';
    notes: string;
    attachments: PurchaseAttachment[];
  }) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return undefined;
      }
      
      const { transaction_id, ...transactionData } = transaction;
      const finalTransactionId = transaction_id || generateTransactionId();
      
      // Creating transaction with generated ID
      
      const { data, error } = await supabase.from('transactions').insert({
        ...transactionData,
        transaction_id: finalTransactionId,
        user_id: user.id,
      }).select('id,transaction_id').single();
      
      if (error) {
        set({ loading: false, error: error.message });
        // Re-throw plan limit errors so UI can handle toast + redirect
        if (
          error.message?.includes('MONTHLY_TRANSACTION_LIMIT_EXCEEDED') ||
          error.message?.includes('TRANSACTION_LIMIT_EXCEEDED')
        ) {
          throw error;
        }
        return undefined;
      }
    
    // If this is an expense transaction with purchase details, create a purchase record
    if (transactionData.type === 'expense' && data?.id && purchaseDetails) {
      const purchaseCategories = get().purchaseCategories;
      // Checking if transaction category matches purchase categories
      const isPurchaseCategory = purchaseCategories.some(cat => cat.category_name === transactionData.category);
      
      if (isPurchaseCategory) {
        // Creating purchase record for transaction
        const account = get().accounts.find(a => a.id === transactionData.account_id);
        const purchaseData = {
          transaction_id: finalTransactionId, // Use the FF format transaction ID
          item_name: transactionData.description || 'Purchase',
          category: transactionData.category,
          price: transactionData.amount,
          purchase_date: transactionData.date,
          status: 'purchased' as const,
          priority: purchaseDetails?.priority || 'medium',
          notes: purchaseDetails?.notes || '',
          user_id: user.id,
          currency: account?.currency || 'USD'
        };
        
        // Purchase data prepared for insertion
        
        const { data: purchaseResult, error: purchaseError } = await supabase.from('purchases').insert(purchaseData).select('id').single();
        if (purchaseError) {
          console.error('Error creating purchase record:', purchaseError);
          // Don't fail the transaction if purchase creation fails
        } else {
          // Purchase record created successfully
          
          // Handle attachments if any
          if (purchaseResult?.id && purchaseDetails?.attachments.length) {
            for (const attachment of purchaseDetails.attachments) {
              if ((attachment as any).file && attachment.file_path.startsWith('blob:')) {
                const { data: uploadData, error: uploadError } = await supabase.storage.from('attachments').upload(`purchases/${purchaseResult.id}/${attachment.file_name}`, (attachment as any).file);
                if (!uploadError && uploadData && uploadData.path) {
                  const { publicUrl } = supabase.storage.from('attachments').getPublicUrl(uploadData.path).data;
                  const attachmentData = {
                    purchase_id: purchaseResult.id,
                    user_id: user.id,
                    file_name: attachment.file_name,
                    file_path: publicUrl,
                    file_size: attachment.file_size,
                    file_type: attachment.file_type,
                    mime_type: attachment.mime_type,
                    created_at: getLocalISOString(),
                  };
                  const { error: insertError } = await supabase.from('purchase_attachments').insert(attachmentData);
                  if (insertError) {
                    // Attachment insert error
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Refresh both transactions and accounts to get updated balances
    await Promise.all([
      get().fetchTransactions(),
      get().fetchAccounts(),
      get().fetchPurchases()
    ]);
    
    // Track transaction creation activity
    await userActivityService.trackTransactionCreated(user.id, { transactionType: transactionData.type });
    
    // Trigger achievement check for transaction creation
    const { checkAndAwardAchievements } = useAchievementStore.getState();
    checkAndAwardAchievements('create_transaction', { transactionType: transactionData.type });
    
    set({ loading: false });
    
      return { id: data.id as string, transaction_id: data.transaction_id as string };
    } catch (err: any) {
      // Re-throw plan-related errors so they can be handled by the UI
      if (err.message && (
        err.message.includes('ACCOUNT_LIMIT_EXCEEDED') ||
        err.message.includes('CURRENCY_LIMIT_EXCEEDED') ||
        err.message.includes('TRANSACTION_LIMIT_EXCEEDED') ||
        err.message.includes('MONTHLY_TRANSACTION_LIMIT_EXCEEDED') ||
        err.message.includes('FEATURE_NOT_AVAILABLE')
      )) {
        set({ loading: false }); // Reset loading state before re-throwing
        throw err; // Re-throw plan-related errors
      }
      
      set({ error: err.message || 'Failed to add transaction', loading: false });
      return undefined;
    }
  },

  updateTransaction: async (id: string, transaction: Partial<Transaction>, purchaseDetails?: {
    priority: 'low' | 'medium' | 'high';
    notes: string;
    attachments: PurchaseAttachment[];
  }) => {
    const currentState = get();
    const originalTransaction = currentState.transactions.find(t => t.id === id);
    
    if (!originalTransaction) {
      set({ error: 'Transaction not found' });
      return;
    }
    
    // OPTIMISTIC UPDATE: Update UI immediately with new data
    const optimisticTransaction = { ...originalTransaction, ...transaction };
    const optimisticTransactions = currentState.transactions.map(t => 
      t.id === id ? optimisticTransaction : t
    );
    
    // Update UI instantly - no loading state for better UX
    set({ transactions: optimisticTransactions, error: null });
    
    try {
      // Perform actual database updates in the background
      const [currentTransactionResult, updateResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('transaction_id, account_id')
          .eq('id', id)
          .single(),
        supabase
          .from('transactions')
          .update(transaction)
          .eq('id', id)
          .select('*')
          .single()
      ]);
      
      if (currentTransactionResult.error || updateResult.error) {
        // ROLLBACK: Revert to original state if database update fails
        set({ 
          transactions: currentState.transactions,
          error: currentTransactionResult.error?.message || updateResult.error?.message || 'Update failed'
        });
        return;
      }
      
      const currentTransaction = currentTransactionResult.data;
      const updatedTransaction = updateResult.data;
      
      // Update with actual server response (in case server modified the data)
      const serverUpdatedTransactions = currentState.transactions.map(t => 
        t.id === id ? updatedTransaction : t
      );
      set({ transactions: serverUpdatedTransactions });
      
      // Background operations that don't affect immediate UI
      const backgroundOperations: Promise<any>[] = [];
      
      // Update purchase record if needed
      if ((transaction.type === 'expense' || transaction.amount !== undefined)) {
        const purchaseUpdateData: any = {
          item_name: transaction.description || 'Purchase',
          price: transaction.amount,
          category: transaction.category
        };
        
        if (purchaseDetails) {
          purchaseUpdateData.priority = purchaseDetails.priority;
          purchaseUpdateData.notes = purchaseDetails.notes;
        }
        
        // Use the transaction's id to find linked purchases
        backgroundOperations.push(
          supabase
            .from('purchases')
            .update(purchaseUpdateData)
            .eq('transaction_id', id)
            .then(({ error }) => {
              if (error) {
                console.error('Error updating purchase record:', error);
              } else {
                console.log('✅ Purchase record updated successfully');
              }
            })
        );
      }
      
      // Only refetch accounts if the transaction amount or account changed (affects balances)
      if (transaction.amount !== undefined || transaction.account_id !== undefined) {
        backgroundOperations.push(get().fetchAccounts());
      }
      
      // Only refetch purchases if this was an expense transaction
      if (transaction.type === 'expense' || originalTransaction.type === 'expense') {
        backgroundOperations.push(get().fetchPurchases());
      }
      
      // Run background operations without blocking UI
      Promise.all(backgroundOperations).catch(error => {
        console.error('Background update operations failed:', error);
        // Don't show error to user since main update succeeded
      });
      
    } catch (error) {
      console.error('Error updating transaction:', error);
      // ROLLBACK: Revert to original state
      set({ 
        transactions: currentState.transactions,
        error: 'Failed to update transaction' 
      });
    }
  },
  
  deleteTransaction: async (id) => {
    set({ loading: true, error: null });
    
    // First, get the current transaction to find its transaction_id
    const { data: currentTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('transaction_id')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('Error fetching transaction for deletion:', fetchError);
      // Continue with transaction deletion even if fetch fails
    }
    
    // Delete linked purchases using the correct transaction_id
    if (currentTransaction?.transaction_id) {
      // TEMPORARY WORKAROUND: Convert transaction_id to string to handle UUID/VARCHAR mismatch
      const transactionIdString = String(currentTransaction.transaction_id);
      
      const { error: purchaseError } = await supabase
        .from('purchases')
        .delete()
        .eq('transaction_id', transactionIdString);
      if (purchaseError) {
        console.error('Error deleting linked purchases:', purchaseError);
        // Continue with transaction deletion even if purchase deletion fails
      }
    }
    
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return set({ loading: false, error: error.message });
    
    // Refresh both transactions and accounts to get updated balances
    await Promise.all([
      get().fetchTransactions(),
      get().fetchAccounts(),
      get().fetchPurchases()
    ]);
    set({ loading: false });
  },
  
  fetchCategories: async (currency?: string) => {
    set({ loading: true, error: null });
    
    const { user, profile } = useAuthStore.getState();
    if (!user) {
      return set({ loading: false, error: 'Not authenticated' });
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching categories:', error);
      return set({ loading: false, error: error.message });
    }

    
    // If no categories exist, initialize with default categories
    if (!data || data.length === 0) {
      // Use passed currency parameter, or get from profile, or skip if neither is available
      const userCurrency = currency || profile?.local_currency;
      
      // Only create categories if user has selected a currency
      // If currency is not set yet, skip category creation (will be created after WelcomeModal)
      if (!userCurrency) {
        set({ categories: [], loading: false });
        return;
      }
      
      // No categories found, initializing with defaults
      const defaultCategoriesToInsert = defaultCategories.map(cat => ({
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
        description: `Default ${cat.type} category`,
        currency: userCurrency
      }));
      
      const { data: insertedCategories, error: insertError } = await supabase
        .from('categories')
        .insert(defaultCategoriesToInsert.map(cat => ({ ...cat, user_id: user.id })))
        .select();
        
      if (insertError) {
        console.error('Error inserting default categories:', insertError);
        return set({ loading: false, error: insertError.message });
      }
      
      set({ categories: insertedCategories || [], loading: false });
      
      // Auto-sync expense categories to purchase categories for new users
      await get().syncExpenseCategoriesWithPurchaseCategories();
    } else {
      // Check for currency mismatch and fix if needed (only for free users)
      const userCurrency = profile?.local_currency || 'USD';
      const isPremium = profile?.subscription?.plan === 'premium';
      const hasCurrencyMismatch = data.some(cat => cat.currency !== userCurrency);
      
      // Only apply mismatch detection if profile subscription data is fully loaded
      if (profile?.subscription?.plan !== undefined) {
        if (!isPremium && hasCurrencyMismatch) {
          console.log(`Currency mismatch detected for free user. Updating categories from ${data[0]?.currency || 'unknown'} to ${userCurrency}`);
          
          // Update existing categories to match user's currency
          const { error: updateError } = await supabase
            .from('categories')
            .update({ currency: userCurrency })
            .eq('user_id', user.id);
            
          if (updateError) {
            console.error('Error updating category currencies:', updateError);
            // Continue with existing data even if update fails
          } else {
            // Update local state with corrected currency
            const updatedCategories = data.map(cat => ({ ...cat, currency: userCurrency }));
            set({ categories: updatedCategories, loading: false });
            return;
          }
        } else if (isPremium && hasCurrencyMismatch) {
          console.log(`Premium user detected with mixed currencies. Preserving existing currency mix.`);
        }
      } else {
        console.log(`Profile subscription data not fully loaded yet. Skipping currency mismatch detection.`);
      }
      
      set({ categories: data || [], loading: false });
    }
  },

  addCategory: async (categoryData) => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) return set({ loading: false, error: 'Not authenticated' });
    
    try {
      // Save to database
      const { data: savedCategory, error } = await supabase
        .from('categories')
        .insert({
          ...categoryData,
          user_id: user.id,
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating category:', error);
        return set({ loading: false, error: error.message });
      }
      
      // Update local state with the saved category
      set((state) => ({ 
        categories: [savedCategory, ...state.categories],
        loading: false 
      }));
      
      // Show success toast
      showToast.success(`Category "${categoryData.name}" created successfully`);
      
      // Track category creation activity
      await userActivityService.trackCategoryCreated(user.id, { categoryType: categoryData.type });
      
      // Trigger achievement check for category creation
      const { checkAndAwardAchievements } = useAchievementStore.getState();
      checkAndAwardAchievements('create_category', { categoryType: categoryData.type });
      
      // If this is an expense category, also create a purchase category to unify them
      if (categoryData.type === 'expense') {
        const newPurchaseCategory: Omit<PurchaseCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
          category_name: categoryData.name,
          description: `Category for ${categoryData.name}`,
          monthly_budget: 0, // Default budget, user can update later
          currency: 'USD', // Default currency
          category_color: categoryData.color || '#3B82F6', // Default blue color if undefined
        };
        
        // Save to database
        const { data: savedPurchaseCategory, error: purchaseError } = await supabase
          .from('purchase_categories')
          .insert({
            ...newPurchaseCategory,
            user_id: user.id,
          })
          .select()
          .single();
          
        if (purchaseError) {
          console.error('Error creating purchase category:', purchaseError);
        } else if (savedPurchaseCategory) {
          // Update local state with the saved purchase category
          set((state) => ({ 
            purchaseCategories: [savedPurchaseCategory, ...state.purchaseCategories]
          }));
        }
      }
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Failed to add category' });
    }
  },

  updateCategory: async (id: string, category: Partial<Category>) => {
    set({ loading: true, error: null });
    
    // Validate type if provided - must be 'income' or 'expense'
    if (category.type && !['income', 'expense'].includes(category.type)) {
      const error = 'Category type must be either "income" or "expense"';
      set({ loading: false, error });
      showToast.error(error);
      return;
    }
    
    // Get existing category to preserve type if not explicitly provided
    const existingCategory = get().categories.find(cat => cat.id === id);
    if (existingCategory && !category.type) {
      // Preserve existing type if not provided in update
      category.type = existingCategory.type;
    }
    
    const { error } = await supabase
      .from('categories')
      .update({
        ...category,
        updated_at: getLocalISOString()
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating category:', error);
      set({ loading: false, error: error.message });
      return;
    }
    
    // Update local state immediately instead of refetching
    set((state) => ({
      categories: state.categories.map(cat => 
        cat.id === id ? { ...cat, ...category, updated_at: new Date().toISOString() } : cat
      ),
      loading: false
    }));
    
    // Show success toast
    showToast.success(`Category updated successfully`);
  },
  
  deleteCategory: async (id: string) => {
    set({ loading: true, error: null });
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting category:', error);
      set({ loading: false, error: error.message });
      return;
    }
    
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
      loading: false
    }));
    
    // Show success toast
    showToast.success('Category deleted successfully');
  },
  
  getDashboardStats: () => {
    const { accounts, transactions } = get();
    const activeAccounts = accounts.filter(a => a.isActive);
    const activeAccountIds = activeAccounts.map(a => a.id);
    const activeTransactions = transactions.filter(t => activeAccountIds.includes(t.account_id));

    // Group by currency
    const byCurrency = activeAccounts.reduce((acc: any[], account) => {
      const currencyGroup = acc.find(g => g.currency === account.currency);
      if (!currencyGroup) {
        // Calculate monthly income and expenses for this currency
        const monthlyTransactions = activeTransactions.filter(t => {
          const transactionAccount = activeAccounts.find(a => a.id === t.account_id);
          const transactionDate = new Date(t.date);
          const currentDate = new Date();
          return transactionAccount?.currency === account.currency &&
                 transactionDate.getMonth() === currentDate.getMonth() &&
                 transactionDate.getFullYear() === currentDate.getFullYear() &&
                 !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer'));
        });

            const monthlyIncome = monthlyTransactions
          .filter(t => t.type === 'income' && !isLendBorrowTransaction(t))
          .reduce((sum, t) => sum + t.amount, 0);

        const monthlyExpenses = monthlyTransactions
          .filter(t => t.type === 'expense' && !isLendBorrowTransaction(t))
          .reduce((sum, t) => sum + t.amount, 0);

        // Debug logging removed to prevent console flood

        acc.push({
          currency: account.currency,
          balance: account.calculated_balance || 0,
          monthlyIncome,
          monthlyExpenses
        });
      } else {
        currencyGroup.balance += (account.calculated_balance || 0);
      }
      return acc;
    }, []);
    
    return {
      byCurrency,
      accountsCount: activeAccounts.length,
      transactionsCount: transactions.length
    };
  },
  
  getTransactionsByAccount: (accountId: string) => {
    return get().transactions.filter((transaction: Transaction) => transaction.account_id === accountId);
  },
  
  getTransactionsByCategory: (category: string) => {
    return get().transactions.filter((transaction: Transaction) => transaction.category === category);
  },

  setGlobalSearchTerm: (term: string) => set({ globalSearchTerm: term }),

  getActiveAccounts: () => get().accounts.filter(a => a.isActive),
  
  getActiveTransactions: () => {
    const activeAccounts = get().accounts.filter(a => a.isActive);
    const activeAccountIds = activeAccounts.map(a => a.id);
    return get().transactions.filter(t => activeAccountIds.includes(t.account_id));
  },

  getCategories: () => get().categories,

  setShowTransactionForm: (show: boolean) => set({ showTransactionForm: show }),
  setShowAccountForm: (show: boolean) => set({ showAccountForm: show }),
  setShowTransferModal: (show: boolean) => set({ showTransferModal: show }),
  setShowPurchaseForm: (show: boolean) => set({ showPurchaseForm: show }),

  transfer: async ({ from_account_id, to_account_id, from_amount, exchange_rate, note, transaction_id }: {
    from_account_id: string,
    to_account_id: string,
    from_amount: number,
    exchange_rate: number,
    note?: string,
    transaction_id?: string
  }) => {
    set({ loading: true, error: null });
    try {
      const { accounts } = get();
      const fromAcc = accounts.find(a => a.id === from_account_id);
      const toAcc = accounts.find(a => a.id === to_account_id);
      
      if (!fromAcc || !toAcc) {
        throw new Error('Invalid account selection');
      }
      if (fromAcc.id === toAcc.id) {
        throw new Error('Source and destination accounts must be different');
      }
      if (fromAcc.calculated_balance < from_amount) {
        throw new Error('Insufficient funds');
      }
      
      const to_amount = from_amount * exchange_rate;
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const transferId = crypto.randomUUID();
      const now = getLocalISOString();
      const finalTransactionId = transaction_id || generateTransactionId();

      // Calculate balances after transfer
      const fromBalanceAfter = fromAcc.calculated_balance - from_amount;
      const toBalanceAfter = toAcc.calculated_balance + to_amount;

      // Create expense transaction for source account
      const { error: sourceError } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: from_account_id,
        amount: from_amount,
        type: 'expense',
        description: note || `Transfer to ${toAcc.name}`,
        date: now,
        category: 'Transfer',
        tags: ['transfer', transferId, to_account_id, to_amount.toString()],
        transaction_id: finalTransactionId,
        balance_after_transfer: fromBalanceAfter,
        transfer_time: now
      });

      if (sourceError) {
        throw new Error(`Failed to create source transaction: ${sourceError.message}`);
      }

      // Create income transaction for destination account
      const { error: destError } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: to_account_id,
        amount: to_amount,
        type: 'income',
        description: note || `Transfer from ${fromAcc.name}`,
        date: now,
        category: 'Transfer',
        tags: ['transfer', transferId, from_account_id, from_amount.toString()],
        transaction_id: finalTransactionId,
        balance_after_transfer: toBalanceAfter,
        transfer_time: now
      });

      if (destError) {
        // Rollback the source transaction if destination fails
        await supabase.from('transactions')
          .delete()
          .match({ user_id: user.id, tags: ['transfer', transferId] });
        throw new Error(`Failed to create destination transaction: ${destError.message}`);
      }

      // Update account balances
      const { error: sourceUpdateError } = await supabase
        .from('accounts')
        .update({ 
          calculated_balance: fromAcc.calculated_balance - from_amount 
        })
        .eq('id', from_account_id);

      if (sourceUpdateError) throw sourceUpdateError;

      const { error: destUpdateError } = await supabase
        .from('accounts')
        .update({ 
          calculated_balance: toAcc.calculated_balance + to_amount 
        })
        .eq('id', to_account_id);

      if (destUpdateError) throw destUpdateError;

      // Refresh both transactions and accounts to get updated balances
      await Promise.all([
        get().fetchTransactions(),
        get().fetchAccounts()
      ]);

      // Audit log for transfer event
      await supabase.from('activity_history').insert({
        user_id: user.id,
        activity_type: 'TRANSFER_CREATED',
        entity_type: 'transfer',
        entity_id: transferId,
        description: `Transfer created: ${fromAcc.name} → ${toAcc.name}`,
        changes: {
          new: {
            from_account_id,
            to_account_id,
            from_amount,
            to_amount,
            exchange_rate,
            note,
            transferId,
            transaction_id: finalTransactionId,
            date: now
          }
        }
      });

      set({ loading: false, error: null });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  fetchSavingsGoals: async () => {
    try {
      set({ loading: true, error: null });
      
      const { user } = useAuthStore.getState();
      if (!user) {
        // No user found
        return set({ loading: false, error: 'Not authenticated' });
      }
      
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ savingsGoals: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch savings goals', loading: false });
    }
  },

  createSavingsGoal: async (goal) => {
    try {
      set({ loading: true, error: null });
      
      // First create a new savings account
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .insert([{
          name: `${goal.name} (Savings)`,
          type: 'savings',
          balance: 0,
          currency: (await get().accounts.find(a => a.id === goal.source_account_id))?.currency || 'USD',
          description: goal.description
        }])
        .select()
        .single();

      if (accountError) throw accountError;

      // Then create the savings goal
      const { error: goalError } = await supabase
        .from('savings_goals')
        .insert([{
          ...goal,
          savings_account_id: accountData.id,
          current_amount: 0
        }]);

      if (goalError) throw goalError;

      // Refresh the data
      await get().fetchSavingsGoals();
      await get().fetchAccounts();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to create savings goal', loading: false });
    }
  },

  updateSavingsGoal: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await get().fetchSavingsGoals();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to update savings goal', loading: false });
    }
  },

  deleteSavingsGoal: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchSavingsGoals();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete savings goal', loading: false });
    }
  },

  saveSavingsGoal: async (goalId: string, amount: number) => {
    try {
      set({ loading: true, error: null });
      const goal = get().savingsGoals.find(g => g.id === goalId);
      if (!goal) throw new Error('Savings goal not found');

      // Create the transfer
      const transferId = crypto.randomUUID();
      const now = getLocalISOString();
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      // Create expense transaction for source account
      const { error: sourceTransactionError } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: goal.source_account_id,
        type: 'expense',
        amount,
        description: `Savings: ${goal.name}`,
        category: 'Transfer',
        date: now,
        tags: ['transfer', transferId, goal.savings_account_id, 'savings']
      });

      if (sourceTransactionError) throw sourceTransactionError;

      // Create income transaction for savings account
      const { error: destTransactionError } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: goal.savings_account_id,
        type: 'income',
        amount,
        description: `Savings: ${goal.name}`,
        category: 'Transfer',
        date: now,
        tags: ['transfer', transferId, goal.source_account_id, 'savings']
      });

      if (destTransactionError) throw destTransactionError;

      // Update the goal's current amount
      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({ current_amount: goal.current_amount + amount })
        .eq('id', goalId);

      if (updateError) throw updateError;

      // Refresh the data
      await get().fetchSavingsGoals();
      await get().fetchAccounts();
      await get().fetchTransactions();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to save to goal', loading: false });
    }
  },

  transferDPS: async ({ from_account_id, amount, transaction_id }: { from_account_id: string, amount: number, transaction_id?: string }) => {
    try {
      set({ loading: true, error: null });
      // Starting DPS transfer
      
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      // Get the source account
      const sourceAccount = get().accounts.find(a => a.id === from_account_id);
      // Source account retrieved
      
      if (!sourceAccount) throw new Error('Source account not found');
      if (!sourceAccount.has_dps) throw new Error('Account does not have DPS enabled');
      if (!sourceAccount.dps_savings_account_id) throw new Error('DPS savings account not found');

      // Get the destination (savings) account
      const destAccount = get().accounts.find(a => a.id === sourceAccount.dps_savings_account_id);
      // Destination account retrieved
      
      if (!destAccount) throw new Error('DPS savings account not found');

      // Create transaction records
      // Creating transaction records
      const transferId = crypto.randomUUID();
      const now = getLocalISOString();
      const finalTransactionId = transaction_id || generateTransactionId();

      // Calculate balances after DPS transfer
      const fromBalanceAfter = sourceAccount.calculated_balance - amount;
      const toBalanceAfter = destAccount.calculated_balance + amount;

      // Create expense transaction for source account
      const { error: sourceTransactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: from_account_id,
          amount: amount,
          type: 'expense',
          description: `DPS Transfer to ${destAccount.name}`,
          date: now,
          category: 'DPS',
          tags: [`dps_transfer_${transferId}`],
          transaction_id: finalTransactionId,
          balance_after_transfer: fromBalanceAfter,
          transfer_time: now
        });

      if (sourceTransactionError) {
        // Source transaction error
        throw sourceTransactionError;
      }

      // Create income transaction for destination account
      const { error: destTransactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: sourceAccount.dps_savings_account_id,
          amount: amount,
          type: 'income',
          description: `DPS Transfer from ${sourceAccount.name}`,
          date: now,
          category: 'DPS',
          tags: [`dps_transfer_${transferId}`],
          transaction_id: finalTransactionId,
          balance_after_transfer: toBalanceAfter,
          transfer_time: now
        });

      if (destTransactionError) {
        // Destination transaction error
        // Rollback the source transaction
        await supabase
          .from('transactions')
          .delete()
          .match({ tags: [`dps_transfer_${transferId}`] });
        throw destTransactionError;
      }

      // Create DPS transfer record
      // Creating DPS transfer record
      const { error: dpsError } = await supabase
        .from('dps_transfers')
        .insert({
          user_id: user.id,
          from_account_id,
          to_account_id: sourceAccount.dps_savings_account_id,
          amount,
          date: now,
          transaction_id: finalTransactionId
        });

      if (dpsError) {
        // DPS transfer record error
        // Rollback the transactions
        await supabase
          .from('transactions')
          .delete()
          .match({ tags: [`dps_transfer_${transferId}`] });
        throw dpsError;
      }

      // Refresh the data
      // Refreshing accounts and transactions
      await Promise.all([
        get().fetchAccounts(),
        get().fetchTransactions()
      ]);
      // DPS transfer completed successfully
      set({ loading: false });
    } catch (err: any) {
      console.error('DPS transfer failed:', err);
      set({ error: err.message || 'Failed to process DPS transfer', loading: false });
      throw err;
    }
  },

  fetchPurchases: async () => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) {
      return set({ loading: false, error: 'Not authenticated' });
    }

    try {
      // Optimized query with limit for better performance
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false })
        .limit(500); // Limit to 500 most recent purchases

      if (error) {
        console.error('Error fetching purchases:', error);
        const errorMessage = error.message ? error.message : 'An unknown error occurred.';
        return set({ loading: false, error: errorMessage });
      }

      set({ purchases: data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching purchases:', error);
      set({ loading: false, error: error.message || 'An unknown error occurred.' });
    }
  },

  addPurchase: async (purchase: Omit<Purchase, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    console.log('🔍 addPurchase called with:', purchase);
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) return set({ loading: false, error: 'Not authenticated' });

    try {
      console.log('🔍 Inserting purchase into database...');
      const { error } = await supabase.from('purchases').insert({
        ...purchase,
        user_id: user.id,
      });

      if (error) {
        console.log('❌ Database error:', error);
        // Re-throw plan-related errors so they can be handled by the UI
        if (error.message && (
          error.message.includes('ACCOUNT_LIMIT_EXCEEDED') ||
          error.message.includes('CURRENCY_LIMIT_EXCEEDED') ||
          error.message.includes('TRANSACTION_LIMIT_EXCEEDED') ||
          error.message.includes('MONTHLY_TRANSACTION_LIMIT_EXCEEDED') ||
          error.message.includes('PURCHASE_LIMIT_EXCEEDED') ||
          error.message.includes('FEATURE_NOT_AVAILABLE')
        )) {
          console.log('🚫 Plan limit error - rethrowing:', error.message);
          set({ loading: false }); // Reset loading state before re-throwing
          throw error; // Re-throw plan-related errors
        }
        
        const errorMessage = error.message ? error.message : 'An unknown error occurred.';
        console.log('❌ Generic database error:', errorMessage);
        set({ loading: false, error: errorMessage });
        return;
      }

      console.log('✅ Purchase inserted successfully!');
      // Add a small delay to ensure the loading animation is visible
      await new Promise(resolve => setTimeout(resolve, 500));

      await get().fetchPurchases();
      set({ loading: false });
    } catch (err: any) {
      console.log('❌ Exception caught in addPurchase:', err);
      // Re-throw plan-related errors so they can be handled by the UI
      if (err.message && (
        err.message.includes('ACCOUNT_LIMIT_EXCEEDED') ||
        err.message.includes('CURRENCY_LIMIT_EXCEEDED') ||
        err.message.includes('TRANSACTION_LIMIT_EXCEEDED') ||
        err.message.includes('MONTHLY_TRANSACTION_LIMIT_EXCEEDED') ||
        err.message.includes('PURCHASE_LIMIT_EXCEEDED') ||
        err.message.includes('FEATURE_NOT_AVAILABLE')
      )) {
        console.log('🚫 Plan limit error in catch - rethrowing:', err.message);
        set({ loading: false }); // Reset loading state before re-throwing
        throw err; // Re-throw plan-related errors
      }
      
      console.log('❌ Generic exception error:', err.message);
      set({ error: err.message || 'Failed to add purchase', loading: false });
    }
  },

  updatePurchase: async (id: string, purchase: Partial<Purchase>) => {
    set({ loading: true, error: null });
    
    // First get the current purchase to check if it has a linked transaction
    const { data: currentPurchase, error: fetchError } = await supabase
      .from('purchases')
      .select('transaction_id, price, item_name, category')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      const errorMessage = fetchError.message ? fetchError.message : 'Failed to fetch purchase';
      set({ loading: false, error: errorMessage });
      return undefined;
    }
    
    // Update the purchase record
    const { error } = await supabase
      .from('purchases')
      .update(purchase)
      .eq('id', id);
      
    if (error) {
      const errorMessage = error.message ? error.message : 'An unknown error occurred.';
      set({ loading: false, error: errorMessage });
      return undefined;
    }
    
    // If purchase has a linked transaction, sync the changes back to the transaction
    if (currentPurchase?.transaction_id) {
      const transactionUpdateData: any = {};
      
      // Map purchase fields to transaction fields
      if (purchase.price !== undefined) {
        transactionUpdateData.amount = purchase.price;
      }
      if (purchase.item_name !== undefined) {
        transactionUpdateData.description = purchase.item_name;
      }
      if (purchase.category !== undefined) {
        transactionUpdateData.category = purchase.category;
      }
      if (purchase.purchase_date !== undefined) {
        transactionUpdateData.date = purchase.purchase_date;
      }
      if (purchase.account_id !== undefined) {
        transactionUpdateData.account_id = purchase.account_id;
      }
      
      // Only update transaction if there are relevant changes
      if (Object.keys(transactionUpdateData).length > 0) {
        const { error: transactionError } = await supabase
          .from('transactions')
          .update(transactionUpdateData)
          .eq('id', currentPurchase.transaction_id);
          
        if (transactionError) {
          console.error('Error syncing purchase changes to transaction:', transactionError);
          // Don't fail the purchase update if transaction sync fails
        }
      }
    }
    
    // Add a small delay to ensure the loading animation is visible
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Refetch both purchases and transactions to ensure UI is in sync
    await Promise.all([
      get().fetchPurchases(),
      get().fetchTransactions(),
      get().fetchAccounts() // Also refetch accounts in case amount changed
    ]);
    set({ loading: false });
  },
  
  deletePurchase: async (id) => {
    set({ loading: true, error: null });
    
    // First, get the current purchase to check if it has a linked transaction
    const { data: currentPurchase, error: fetchError } = await supabase
      .from('purchases')
      .select('transaction_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching purchase for deletion:', fetchError);
      // Continue with purchase deletion even if fetch fails
    }
    
    // Delete the purchase record
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) {
      console.error('Error deleting purchase:', error);
      return set({ loading: false, error: error.message });
    }
    
    // If purchase had a linked transaction, delete it too
    if (currentPurchase?.transaction_id) {
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', currentPurchase.transaction_id);
        
      if (transactionError) {
        console.error('Error deleting linked transaction:', transactionError);
        // Continue even if transaction deletion fails
      }
    }
    
    // Refresh both purchases and transactions to get updated data
    await Promise.all([
      get().fetchPurchases(),
      get().fetchTransactions(),
      get().fetchAccounts() // Also refetch accounts in case transaction deletion affected balances
    ]);
    set({ loading: false });
  },

  bulkUpdatePurchases: async (ids: string[], updates: Partial<Purchase>) => {
    set({ loading: true, error: null });
    
    const { error } = await supabase
      .from('purchases')
      .update(updates)
      .in('id', ids);
    
    if (error) {
      set({ loading: false, error: error.message });
      return undefined;
    }
    
    // Add a small delay to ensure the loading animation is visible
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await Promise.all([
      get().fetchPurchases(),
      get().fetchAccounts()
    ]);
    set({ loading: false });
  },

  fetchPurchaseCategories: async () => {
    set({ loading: true, error: null });
    
    const { user, profile } = useAuthStore.getState();
    if (!user) {
      return set({ loading: false, error: 'Not authenticated' });
    }
    const { data, error } = await supabase
      .from('purchase_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      const errorMessage = error.message ? error.message : 'Failed to fetch purchase categories';
      console.error('Error fetching purchase categories:', error);
      return set({ loading: false, error: errorMessage });
    }

    // Check for currency mismatch and fix if needed (only for free users)
    if (data && data.length > 0) {
      const userCurrency = profile?.local_currency || 'USD';
      const isPremium = profile?.subscription?.plan === 'premium';
      const hasCurrencyMismatch = data.some(cat => cat.currency !== userCurrency);
      
      // Only apply mismatch detection if profile subscription data is fully loaded
      if (profile?.subscription?.plan !== undefined) {
        if (!isPremium && hasCurrencyMismatch) {
          console.log(`Currency mismatch detected in purchase categories for free user. Updating from ${data[0]?.currency || 'unknown'} to ${userCurrency}`);
          
          // Update existing purchase categories to match user's currency
          const { error: updateError } = await supabase
            .from('purchase_categories')
            .update({ currency: userCurrency })
            .eq('user_id', user.id);
            
          if (updateError) {
            console.error('Error updating purchase category currencies:', updateError);
            // Continue with existing data even if update fails
          } else {
            // Update local state with corrected currency
            const updatedCategories = data.map(cat => ({ ...cat, currency: userCurrency }));
            set({ purchaseCategories: updatedCategories, loading: false });
            return;
          }
        } else if (isPremium && hasCurrencyMismatch) {
          console.log(`Premium user detected with mixed purchase category currencies. Preserving existing currency mix.`);
        }
      } else {
        console.log(`Profile subscription data not fully loaded yet. Skipping purchase category currency mismatch detection.`);
      }
    }

    // Purchase categories data loaded
    set({ purchaseCategories: data || [], loading: false });
  },

  addPurchaseCategory: async (category: Omit<PurchaseCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) return set({ loading: false, error: 'Not authenticated' });
    
    const { data, error } = await supabase.from('purchase_categories').insert({
      ...category,
      user_id: user.id,
    }).select().single();
    
    if (error) {
      console.error('Error adding purchase category:', error);
      return set({ loading: false, error: error.message });
    }
    
    set((state) => ({ 
      purchaseCategories: [data, ...state.purchaseCategories],
      loading: false 
    }));
  },

  updatePurchaseCategory: async (id: string, category: Partial<PurchaseCategory>) => {
    set({ loading: true, error: null });
    
    const { error } = await supabase
      .from('purchase_categories')
      .update({
        ...category,
        updated_at: getLocalISOString()
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating purchase category:', error);
      set({ loading: false, error: error.message });
      return undefined;
    }
    
    await get().fetchPurchaseCategories();
    set({ loading: false });
  },

  deletePurchaseCategory: async (id: string) => {
    set({ loading: true, error: null });
    
    // Get the category name before deleting
    const categoryToDelete = get().purchaseCategories.find(c => c.id === id);
    
    const { error } = await supabase.from('purchase_categories').delete().eq('id', id);
    if (error) {
      set({ error: error.message });
    } else {
      // Remember this category was intentionally deleted
      if (categoryToDelete) {
        const deletedCategories = JSON.parse(localStorage.getItem('deletedPurchaseCategories') || '[]');
        const normalizedName = categoryToDelete.category_name.trim().toLowerCase();
        if (!deletedCategories.includes(normalizedName)) {
          deletedCategories.push(normalizedName);
          localStorage.setItem('deletedPurchaseCategories', JSON.stringify(deletedCategories));
        }
      }
      
      set((state) => ({
        purchaseCategories: state.purchaseCategories.filter((c) => c.id !== id),
      }));
    }
    set({ loading: false });
  },

  getPurchaseAnalytics: () => {
    const { purchases } = get();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyPurchases = purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.purchase_date);
      return purchaseDate.getMonth() === currentMonth && 
             purchaseDate.getFullYear() === currentYear &&
             purchase.status === 'purchased';
    });
    
    const totalSpent = purchases
      .filter(p => p.status === 'purchased')
      .reduce((sum, p) => sum + p.price, 0);
    
    const monthlySpent = monthlyPurchases.reduce((sum, p) => sum + p.price, 0);
    
    const plannedCount = purchases.filter(p => p.status === 'planned').length;
    const purchasedCount = purchases.filter(p => p.status === 'purchased').length;
    const cancelledCount = purchases.filter(p => p.status === 'cancelled').length;
    
    // Calculate category breakdown
    const categoryMap = new Map<string, { total: number; count: number }>();
    purchases
      .filter(p => p.status === 'purchased')
      .forEach(purchase => {
        const existing = categoryMap.get(purchase.category) || { total: 0, count: 0 };
        categoryMap.set(purchase.category, {
          total: existing.total + purchase.price,
          count: existing.count + 1
        });
      });
    
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total_spent: data.total,
        item_count: data.count,
        percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0
      }))
      .sort((a, b) => b.total_spent - a.total_spent);
    
    const topCategory = categoryBreakdown[0]?.category;
    
    return {
      currency: 'USD', // Default currency for backward compatibility
      total_spent: totalSpent,
      monthly_spent: monthlySpent,
      planned_count: plannedCount,
      purchased_count: purchasedCount,
      cancelled_count: cancelledCount,
      top_category: topCategory,
      category_breakdown: categoryBreakdown
    };
  },

  getMultiCurrencyPurchaseAnalytics: () => {
    const { purchases } = get();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Group purchases by currency
    const currencyMap = new Map<string, Purchase[]>();
    purchases.forEach(purchase => {
      const currency = purchase.currency || 'USD';
      if (!currencyMap.has(currency)) {
        currencyMap.set(currency, []);
      }
      currencyMap.get(currency)!.push(purchase);
    });
    
    const analyticsByCurrency: PurchaseAnalytics[] = [];
    
    currencyMap.forEach((currencyPurchases, currency) => {
      const monthlyPurchases = currencyPurchases.filter(purchase => {
        const purchaseDate = new Date(purchase.purchase_date);
        return purchaseDate.getMonth() === currentMonth && 
               purchaseDate.getFullYear() === currentYear &&
               purchase.status === 'purchased';
      });
      
      const totalSpent = currencyPurchases
        .filter(p => p.status === 'purchased')
        .reduce((sum, p) => sum + p.price, 0);
      
      const monthlySpent = monthlyPurchases.reduce((sum, p) => sum + p.price, 0);
      
      const plannedCount = currencyPurchases.filter(p => p.status === 'planned').length;
      const purchasedCount = currencyPurchases.filter(p => p.status === 'purchased').length;
      const cancelledCount = currencyPurchases.filter(p => p.status === 'cancelled').length;
      
      // Calculate category breakdown for this currency
      const categoryMap = new Map<string, { total: number; count: number }>();
      currencyPurchases
        .filter(p => p.status === 'purchased')
        .forEach(purchase => {
          const existing = categoryMap.get(purchase.category) || { total: 0, count: 0 };
          categoryMap.set(purchase.category, {
            total: existing.total + purchase.price,
            count: existing.count + 1
          });
        });
      
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          total_spent: data.total,
          item_count: data.count,
          percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0
        }))
        .sort((a, b) => b.total_spent - a.total_spent);
      
      const topCategory = categoryBreakdown[0]?.category;
      
      analyticsByCurrency.push({
        currency,
        total_spent: totalSpent,
        monthly_spent: monthlySpent,
        planned_count: plannedCount,
        purchased_count: purchasedCount,
        cancelled_count: cancelledCount,
        top_category: topCategory,
        category_breakdown: categoryBreakdown
      });
    });
    
    return {
      byCurrency: analyticsByCurrency,
      total_currencies: analyticsByCurrency.length
    };
  },

  getPurchasesByCategory: (category: string) => {
    return get().purchases.filter((purchase: Purchase) => purchase.category === category);
  },

  getPurchasesByStatus: (status: Purchase['status']) => {
    return get().purchases.filter((purchase: Purchase) => purchase.status === status);
  },

  fetchAllData: async () => {
    set({ loading: true, error: null });
    
    try {
      // Add a flag to prevent multiple simultaneous calls
      const currentState = get();
      if (currentState.loading) {
        return;
      }
      const results = await Promise.allSettled([
        get().fetchCategories(),
        get().fetchAccounts(),
        get().fetchTransactions(),
        get().fetchPurchases(),
        get().fetchPurchaseCategories(),
        get().fetchDonationSavingRecords(),
      ]);
      
      
      // Sync existing expense categories with purchase categories
      await get().syncExpenseCategoriesWithPurchaseCategories();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  syncExpenseCategoriesWithPurchaseCategories: async () => {
    const { user, profile } = useAuthStore.getState();
    if (!user) return;
    
    // Get user's selected currency from profile, fallback to USD
    const userCurrency = profile?.local_currency || 'USD';
    
    // Only use actual user categories from database
    const userCategories = get().categories;
    // Only use unique, trimmed, lowercased names for comparison
    const expenseCategories = userCategories.filter(cat => cat.type === 'expense');
    const existingPurchaseCategories = get().purchaseCategories;
    
    // Get list of categories that were intentionally deleted by user
    // We'll store this in localStorage to remember user's choices
    const deletedCategories = JSON.parse(localStorage.getItem('deletedPurchaseCategories') || '[]');
    
    for (const expenseCat of expenseCategories) {
      const normalizedName = expenseCat.name.trim().toLowerCase();
      const hasPurchaseCategory = existingPurchaseCategories.some(
        pc => pc.category_name.trim().toLowerCase() === normalizedName
      );
      
      // Check if user intentionally deleted this category
      const wasIntentionallyDeleted = deletedCategories.includes(normalizedName);
      
      // Only create if it doesn't exist AND wasn't intentionally deleted
      if (!hasPurchaseCategory && !wasIntentionallyDeleted) {
        // Use the currency from the expense category itself, fallback to user's currency
        const categoryCurrency = expenseCat.currency || userCurrency;
        
        // Create missing purchase category
        const newPurchaseCategory = {
          category_name: expenseCat.name,
          description: `Category for ${expenseCat.name}`,
          monthly_budget: 0,
          currency: categoryCurrency,
          category_color: expenseCat.color || '#3B82F6',
        };
        const { data: savedCategory, error } = await supabase
          .from('purchase_categories')
          .insert({
            ...newPurchaseCategory,
            user_id: user.id,
          })
          .select()
          .single();
        if (!error && savedCategory) {
          set((state) => ({ 
            purchaseCategories: [savedCategory, ...state.purchaseCategories]
          }));
        }
      }
    }
  },

  // Clear the list of deleted categories (useful for resetting)
  clearDeletedCategoriesList: () => {
    localStorage.removeItem('deletedPurchaseCategories');
  },

  // Purchase Attachments
  uploadPurchaseAttachment: async (purchaseId: string, file: File, purchase?: any) => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) return set({ loading: false, error: 'Not authenticated' });
    
    try {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }
      
      // Validate file type
      const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'docx', 'xlsx', 'txt'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        throw new Error('File type not allowed. Allowed types: jpg, jpeg, png, gif, pdf, docx, xlsx, txt');
      }
      
      // Generate friendly file name and storage path
      let fileName: string;
      let storagePath: string;
      
      if (purchase) {
        // Use friendly naming if purchase data is available
        const { generateFriendlyStoragePath } = await import('../utils/urlShortener');
        storagePath = generateFriendlyStoragePath(purchase, file);
        fileName = storagePath.split('/').pop() || file.name;
      } else {
        // Fallback to original naming
        fileName = `${purchaseId}/${Date.now()}_${file.name}`;
        storagePath = fileName;
      }
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(storagePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(storagePath);
      
      // Create short URL for better UX
      let shortUrl = urlData.publicUrl;
      try {
        const { createShortUrl } = await import('../utils/urlShortener');
        shortUrl = await createShortUrl(urlData.publicUrl, file.name, purchaseId);
      } catch (shortUrlError) {
        // Failed to create short URL, using original URL
      }
      
      // Create attachment record in database
      const { error: dbError } = await supabase.from('purchase_attachments').insert({
        purchase_id: purchaseId,
        user_id: user.id,
        file_name: file.name,
        file_path: shortUrl, // Store the short URL instead of storage path
        file_size: file.size,
        file_type: fileExtension,
        mime_type: file.type
      });
      
      if (dbError) throw dbError;
      
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
    }
  },

  fetchPurchaseAttachments: async (purchaseId: string): Promise<PurchaseAttachment[]> => {
    const { user } = useAuthStore.getState();
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('purchase_attachments')
      .select('*')
      .eq('purchase_id', purchaseId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching attachments:', error);
      return [];
    }
    
    return data || [];
  },

  deletePurchaseAttachment: async (attachmentId: string) => {
    set({ loading: true, error: null });
    
    try {
      // Get attachment details first
      const { data: attachment, error: fetchError } = await supabase
        .from('purchase_attachments')
        .select('file_path')
        .eq('id', attachmentId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Delete from storage
      if (attachment?.file_path) {
        const { error: storageError } = await supabase.storage
          .from('purchase-attachments')
          .remove([attachment.file_path]);
          
        if (storageError) {
          console.error('Error deleting from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('purchase_attachments')
        .delete()
        .eq('id', attachmentId);
        
      if (dbError) throw dbError;
      
      set({ loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
    }
  },

  // Donation & Savings Management
  fetchDonationSavingRecords: async () => {
    try {
      set({ loading: true, error: null });
      
      const { user } = useAuthStore.getState();
      if (!user) {
        return set({ loading: false, error: 'Not authenticated' });
      }
      const { data, error } = await supabase
        .from('donation_saving_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      set({ donationSavingRecords: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch donation/saving records', loading: false });
    }
  },

  getDonationSavingAnalytics: () => {
    const { donationSavingRecords } = get();
    
    const totalSaved = donationSavingRecords
      .filter(record => record.type === 'saving')
      .reduce((sum, record) => sum + record.amount, 0);

    const totalDonated = donationSavingRecords
      .filter(record => record.type === 'donation')
      .reduce((sum, record) => sum + record.amount, 0);

    // Calculate monthly breakdown
    const monthlyMap = new Map<string, { saved: number; donated: number; total: number }>();
    
    donationSavingRecords.forEach(record => {
      const date = new Date(record.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthlyMap.get(monthKey) || { saved: 0, donated: 0, total: 0 };
      
      if (record.type === 'saving') {
        existing.saved += record.amount;
      } else {
        existing.donated += record.amount;
      }
      existing.total = existing.saved + existing.donated;
      
      monthlyMap.set(monthKey, existing);
    });

    const monthlyBreakdown = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        saved: data.saved,
        donated: data.donated,
        total: data.total
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    // Find top month
    const topMonth = monthlyBreakdown.length > 0 ? monthlyBreakdown[0] : null;

    // Calculate type breakdown
    const typeBreakdown = [
      {
        type: 'saving' as const,
        total: totalSaved,
        count: donationSavingRecords.filter(r => r.type === 'saving').length,
        percentage: (totalSaved + totalDonated) > 0 ? (totalSaved / (totalSaved + totalDonated)) * 100 : 0
      },
      {
        type: 'donation' as const,
        total: totalDonated,
        count: donationSavingRecords.filter(r => r.type === 'donation').length,
        percentage: (totalSaved + totalDonated) > 0 ? (totalDonated / (totalSaved + totalDonated)) * 100 : 0
      }
    ];

    // Calculate mode breakdown
    const modeBreakdown = [
      {
        mode: 'fixed' as const,
        total: donationSavingRecords.filter(r => r.mode === 'fixed').reduce((sum, r) => sum + r.amount, 0),
        count: donationSavingRecords.filter(r => r.mode === 'fixed').length,
        percentage: (totalSaved + totalDonated) > 0 ? 
          (donationSavingRecords.filter(r => r.mode === 'fixed').reduce((sum, r) => sum + r.amount, 0) / (totalSaved + totalDonated)) * 100 : 0
      },
      {
        mode: 'percent' as const,
        total: donationSavingRecords.filter(r => r.mode === 'percent').reduce((sum, r) => sum + r.amount, 0),
        count: donationSavingRecords.filter(r => r.mode === 'percent').length,
        percentage: (totalSaved + totalDonated) > 0 ? 
          (donationSavingRecords.filter(r => r.mode === 'percent').reduce((sum, r) => sum + r.amount, 0) / (totalSaved + totalDonated)) * 100 : 0
      }
    ];

    return {
      total_saved: totalSaved,
      total_donated: totalDonated,
      top_month: topMonth?.month,
      monthly_breakdown: monthlyBreakdown,
      type_breakdown: typeBreakdown,
      mode_breakdown: modeBreakdown
    };
  },

  getDonationSavingRecordsByType: (type: 'saving' | 'donation') => {
    return get().donationSavingRecords.filter(record => record.type === type);
  },

  getDonationSavingRecordsByMonth: (month: string) => {
    return get().donationSavingRecords.filter(record => {
      const recordDate = new Date(record.created_at);
      return recordDate.toISOString().startsWith(month);
    });
  },

  deleteDonationSavingRecord: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // First, get the record to check if it's a manual donation
      const { data: record, error: fetchError } = await supabase
        .from('donation_saving_records')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        throw new Error('Record not found or access denied');
      }

      // Only allow deletion of manual donations (those with custom_transaction_id and no transaction_id)
      if (record.transaction_id !== null) {
        throw new Error('Cannot delete donations linked to transactions. Only manual donations can be deleted.');
      }

      // Delete the record
      const { error: deleteError } = await supabase
        .from('donation_saving_records')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Refresh the records
      await get().fetchDonationSavingRecords();
      set({ loading: false });
      
      return { success: true };
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete donation record', loading: false });
      return { success: false, error: err.message };
    }
  },

  // Lend & Borrow Analytics
  getLendBorrowAnalytics: () => {
    // For now, return dummy data since we don't have lend/borrow data in the store yet
    // This would be implemented to fetch from the lend_borrow table
    return {
      total_lent: 5000,
      total_borrowed: 2300,
      outstanding_lent: 3200,
      outstanding_borrowed: 1500,
      overdue_count: 1,
      active_count: 5,
      settled_count: 8,
      top_person: 'John Smith',
      byCurrency: [
        {
          currency: 'USD',
          total_lent: 5000,
          total_borrowed: 2300,
          outstanding_lent: 3200,
          outstanding_borrowed: 1500
        },
        {
          currency: 'EUR',
          total_lent: 4200,
          total_borrowed: 1800,
          outstanding_lent: 2800,
          outstanding_borrowed: 1200
        }
      ]
    };
  },

  // Lend & Borrow Management
  fetchLendBorrowRecords: async () => {
    try {
      set({ loading: true, error: null });

      const { user } = useAuthStore.getState();
      if (!user) {
        return set({ loading: false, error: 'Not authenticated' });
      }
      
      const { data, error } = await supabase
        .from('lend_borrow')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase fetch error:', error);
        throw error;
      }
      set({ lendBorrowRecords: data || [], loading: false });
    } catch (err: any) {
      console.error('❌ fetchLendBorrowRecords error:', err);
      set({ error: err.message || 'Failed to fetch lend/borrow records', loading: false });
    }
  },

  addLendBorrowRecord: async (record: any) => {
    try {
      set({ loading: true, error: null });
      
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      // Validate required fields for account integration
      if (record.affect_account_balance && !record.account_id) {
        throw new Error('Account selection is required when affecting account balance');
      }

      const cleanRecord = {
        ...record,
        due_date: record.due_date === "" ? null : record.due_date,
        partial_return_date: record.partial_return_date === "" ? null : record.partial_return_date,
        account_id: record.account_id === "" ? null : record.account_id,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('lend_borrow')
        .insert([cleanRecord])
        .select();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }

      // Create audit log for lend/borrow record creation
      if (data && data[0]) {
        await createAuditLog({
          action_type: 'create',
          entity_type: 'lend_borrow',
          entity_id: data[0].id,
          old_values: null,
          new_values: {
            person_name: data[0].person_name,
            amount: data[0].amount,
            type: data[0].type,
            currency: data[0].currency,
            due_date: data[0].due_date
          },
          metadata: {
            summary: `${data[0].type === 'lend' ? 'Lent' : 'Borrowed'} ${data[0].amount} ${data[0].currency} ${data[0].type === 'lend' ? 'to' : 'from'} ${data[0].person_name}`
          }
        });
      }

      // Refresh both lend/borrow records and accounts to get updated balances
      await Promise.all([
        get().fetchLendBorrowRecords(),
        get().fetchAccounts(),
        get().fetchTransactions()
      ]);
      
      set({ loading: false });
    } catch (err: any) {
      console.error('❌ addLendBorrowRecord error:', err);
      set({ error: err.message || 'Failed to add lend/borrow record', loading: false });
    }
  },

  updateLendBorrowRecord: async (id: string, updates: Partial<LendBorrow>) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('User not authenticated');
      
      // Get the current record before updating for audit log
      const { data: currentRecord } = await supabase
        .from('lend_borrow')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      // Clean the updates data - convert empty strings to null for date fields
      const cleanedUpdates = { ...updates } as any;
      if (cleanedUpdates.due_date === '') cleanedUpdates.due_date = null;
      if (cleanedUpdates.partial_return_date === '') cleanedUpdates.partial_return_date = null;
      
      const { data: updatedData, error } = await supabase
        .from('lend_borrow')
        .update({
          ...cleanedUpdates,
          updated_at: getLocalISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;
      
      // Create audit log for lend/borrow record update
      if (currentRecord && updatedData && updatedData[0]) {
        await createAuditLog({
          action_type: 'update',
          entity_type: 'lend_borrow',
          entity_id: id,
          old_values: {
            person_name: currentRecord.person_name,
            amount: currentRecord.amount,
            type: currentRecord.type,
            currency: currentRecord.currency,
            due_date: currentRecord.due_date
          },
          new_values: {
            person_name: updatedData[0].person_name,
            amount: updatedData[0].amount,
            type: updatedData[0].type,
            currency: updatedData[0].currency,
            due_date: updatedData[0].due_date
          },
          metadata: {
            summary: `Updated ${updatedData[0].type === 'lend' ? 'loan to' : 'borrowing from'} ${updatedData[0].person_name}`
          }
        });
      }
      
      // Refresh all related data when updating lend/borrow records
      await Promise.all([
        get().fetchLendBorrowRecords(),
        get().fetchAccounts(),
        get().fetchTransactions()
      ]);
      
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to update lend/borrow record', loading: false });
    }
  },

  deleteLendBorrowRecord: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      // Get the record before deleting for audit log
      const { data: recordToDelete } = await supabase
        .from('lend_borrow')
        .select('*')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('lend_borrow')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Create audit log for lend/borrow record deletion
      if (recordToDelete) {
        await createAuditLog({
          action_type: 'delete',
          entity_type: 'lend_borrow',
          entity_id: id,
          old_values: {
            person_name: recordToDelete.person_name,
            amount: recordToDelete.amount,
            type: recordToDelete.type,
            currency: recordToDelete.currency,
            due_date: recordToDelete.due_date
          },
          new_values: null,
          metadata: {
            summary: `Deleted ${recordToDelete.type === 'lend' ? 'loan to' : 'borrowing from'} ${recordToDelete.person_name}`
          }
        });
      }
      
      await get().fetchLendBorrowRecords();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete lend/borrow record', loading: false });
    }
  },

  // Payment History Management
  fetchPaymentTransactions: async () => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      
      if (!user) {
        set({ loading: false });
        return;
      }

      // Fetch from subscription_history table (the REAL table)
      const { data: historyData, error: historyError } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (historyError) {
        console.error('Error fetching subscription history:', historyError);
        set({ 
          error: historyError.message, 
          paymentTransactions: [],
          loading: false 
        });
        return;
      }

      // Transform subscription_history data to payment transaction format
      const transformedTransactions = historyData?.map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        plan_id: sub.plan_id,
        amount: sub.amount_paid || 0,
        currency: sub.currency || 'USD',
        payment_provider: 'stripe' as const, // Default to stripe
        provider_transaction_id: sub.id, // Use subscription history ID
        status: sub.status === 'active' ? 'completed' as const : 
                sub.status === 'cancelled' ? 'cancelled' as const : 
                sub.status === 'expired' ? 'failed' as const :
                'pending' as const,
        payment_method: sub.payment_method || 'N/A',
        billing_cycle: 'monthly' as const, // Default billing cycle
        transaction_type: 'payment' as const,
        metadata: { 
          source: 'subscription_history',
          start_date: sub.start_date,
          end_date: sub.end_date 
        },
        created_at: sub.created_at,
        plan_name: sub.plan_name || 'Unknown Plan'
      })) || [];

      set({ 
        paymentTransactions: transformedTransactions,
        loading: false 
      });
    } catch (err: any) {
      console.error('Error fetching payment transactions:', err);
      set({ 
        error: err.message || 'Failed to fetch payment transactions', 
        paymentTransactions: [],
        loading: false 
      });
    }
  },

  getPaymentHistoryStats: (): PaymentHistoryStats => {
    const { paymentTransactions } = get();
    
    return {
      totalTransactions: paymentTransactions.length,
      totalAmount: paymentTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      completedTransactions: paymentTransactions.filter(tx => tx.status === 'completed').length,
      pendingTransactions: paymentTransactions.filter(tx => tx.status === 'pending').length,
      failedTransactions: paymentTransactions.filter(tx => tx.status === 'failed').length,
      refundedTransactions: paymentTransactions.filter(tx => tx.status === 'refunded').length
    };
  },

  // Investment Management Methods
  setShowInvestmentAssetForm: (show: boolean) => set({ showInvestmentAssetForm: show }),
  setShowInvestmentTransactionForm: (show: boolean) => set({ showInvestmentTransactionForm: show }),
  setShowInvestmentGoalForm: (show: boolean) => set({ showInvestmentGoalForm: show }),

  // Investment Assets
  fetchInvestmentAssets: async () => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ loading: false, error: 'Not authenticated' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('investment_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ investmentAssets: data || [], loading: false });
    } catch (err: any) {
      console.error('Error fetching investment assets:', err);
      set({ error: err.message, loading: false });
    }
  },

  addInvestmentAsset: async (asset: InvestmentAssetInput) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('Not authenticated');

    try {
      const { data, error } = await supabase
        .from('investment_assets')
        .insert([{ ...asset, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        investmentAssets: [data, ...state.investmentAssets]
      }));

      showToast('Asset added successfully', 'success');
    } catch (err: any) {
      console.error('Error adding investment asset:', err);
      showToast(err.message || 'Failed to add asset', 'error');
      throw err;
    }
  },

  updateInvestmentAsset: async (id: string, asset: Partial<InvestmentAssetInput>) => {
    try {
      const { data, error } = await supabase
        .from('investment_assets')
        .update(asset)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        investmentAssets: state.investmentAssets.map(a => a.id === id ? data : a)
      }));

      showToast('Asset updated successfully', 'success');
    } catch (err: any) {
      console.error('Error updating investment asset:', err);
      showToast(err.message || 'Failed to update asset', 'error');
      throw err;
    }
  },

  deleteInvestmentAsset: async (id: string) => {
    try {
      const { error } = await supabase
        .from('investment_assets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        investmentAssets: state.investmentAssets.filter(a => a.id !== id)
      }));

      showToast('Asset deleted successfully', 'success');
    } catch (err: any) {
      console.error('Error deleting investment asset:', err);
      showToast(err.message || 'Failed to delete asset', 'error');
      throw err;
    }
  },

  // Investment Transactions
  fetchInvestmentTransactions: async () => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ loading: false, error: 'Not authenticated' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('investment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      set({ investmentTransactions: data || [], loading: false });
    } catch (err: any) {
      console.error('Error fetching investment transactions:', err);
      set({ error: err.message, loading: false });
    }
  },

  addInvestmentTransaction: async (transaction: InvestmentTransactionInput) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('Not authenticated');

    try {
      const { data, error } = await supabase
        .from('investment_transactions')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        investmentTransactions: [data, ...state.investmentTransactions]
      }));

      showToast('Transaction added successfully', 'success');
    } catch (err: any) {
      console.error('Error adding investment transaction:', err);
      showToast(err.message || 'Failed to add transaction', 'error');
      throw err;
    }
  },

  updateInvestmentTransaction: async (id: string, transaction: Partial<InvestmentTransactionInput>) => {
    try {
      const { data, error } = await supabase
        .from('investment_transactions')
        .update(transaction)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        investmentTransactions: state.investmentTransactions.map(t => t.id === id ? data : t)
      }));

      showToast('Transaction updated successfully', 'success');
    } catch (err: any) {
      console.error('Error updating investment transaction:', err);
      showToast(err.message || 'Failed to update transaction', 'error');
      throw err;
    }
  },

  deleteInvestmentTransaction: async (id: string) => {
    try {
      const { error } = await supabase
        .from('investment_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        investmentTransactions: state.investmentTransactions.filter(t => t.id !== id)
      }));

      showToast('Transaction deleted successfully', 'success');
    } catch (err: any) {
      console.error('Error deleting investment transaction:', err);
      showToast(err.message || 'Failed to delete transaction', 'error');
      throw err;
    }
  },

  // Investment Categories
  fetchInvestmentCategories: async () => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ loading: false, error: 'Not authenticated' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('investment_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      set({ investmentCategories: data || [], loading: false });
    } catch (err: any) {
      console.error('Error fetching investment categories:', err);
      set({ error: err.message, loading: false });
    }
  },

  addInvestmentCategory: async (category: InvestmentCategoryInput) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('Not authenticated');

    try {
      const { data, error } = await supabase
        .from('investment_categories')
        .insert([{ ...category, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        investmentCategories: [...state.investmentCategories, data]
      }));

      showToast('Category added successfully', 'success');
    } catch (err: any) {
      console.error('Error adding investment category:', err);
      showToast(err.message || 'Failed to add category', 'error');
      throw err;
    }
  },

  updateInvestmentCategory: async (id: string, category: Partial<InvestmentCategoryInput>) => {
    try {
      const { data, error } = await supabase
        .from('investment_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        investmentCategories: state.investmentCategories.map(c => c.id === id ? data : c)
      }));

      showToast('Category updated successfully', 'success');
    } catch (err: any) {
      console.error('Error updating investment category:', err);
      showToast(err.message || 'Failed to update category', 'error');
      throw err;
    }
  },

  deleteInvestmentCategory: async (id: string) => {
    try {
      const { error } = await supabase
        .from('investment_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        investmentCategories: state.investmentCategories.filter(c => c.id !== id)
      }));

      showToast('Category deleted successfully', 'success');
    } catch (err: any) {
      console.error('Error deleting investment category:', err);
      showToast(err.message || 'Failed to delete category', 'error');
      throw err;
    }
  },

  // Investment Goals
  fetchInvestmentGoals: async () => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ loading: false, error: 'Not authenticated' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('investment_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ investmentGoals: data || [], loading: false });
    } catch (err: any) {
      console.error('Error fetching investment goals:', err);
      set({ error: err.message, loading: false });
    }
  },

  addInvestmentGoal: async (goal: InvestmentGoalInput) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('Not authenticated');

    try {
      const { data, error } = await supabase
        .from('investment_goals')
        .insert([{ ...goal, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        investmentGoals: [data, ...state.investmentGoals]
      }));

      showToast('Goal added successfully', 'success');
    } catch (err: any) {
      console.error('Error adding investment goal:', err);
      showToast(err.message || 'Failed to add goal', 'error');
      throw err;
    }
  },

  updateInvestmentGoal: async (id: string, goal: Partial<InvestmentGoalInput>) => {
    try {
      const { data, error } = await supabase
        .from('investment_goals')
        .update(goal)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        investmentGoals: state.investmentGoals.map(g => g.id === id ? data : g)
      }));

      showToast('Goal updated successfully', 'success');
    } catch (err: any) {
      console.error('Error updating investment goal:', err);
      showToast(err.message || 'Failed to update goal', 'error');
      throw err;
    }
  },

  deleteInvestmentGoal: async (id: string) => {
    try {
      const { error } = await supabase
        .from('investment_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        investmentGoals: state.investmentGoals.filter(g => g.id !== id)
      }));

      showToast('Goal deleted successfully', 'success');
    } catch (err: any) {
      console.error('Error deleting investment goal:', err);
      showToast(err.message || 'Failed to delete goal', 'error');
      throw err;
    }
  },

  // Investment Analytics
  getInvestmentAnalytics: (): InvestmentAnalytics => {
    const { investmentAssets, investmentTransactions } = get();
    
    const totalPortfolioValue = investmentAssets.reduce((sum, asset) => sum + asset.total_value, 0);
    const totalCostBasis = investmentAssets.reduce((sum, asset) => sum + asset.cost_basis, 0);
    const totalUnrealizedGainLoss = investmentAssets.reduce((sum, asset) => sum + asset.unrealized_gain_loss, 0);
    const totalRealizedGainLoss = investmentAssets.reduce((sum, asset) => sum + asset.realized_gain_loss, 0);
    const totalGainLoss = totalUnrealizedGainLoss + totalRealizedGainLoss;
    const overallReturnPercentage = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

    // Asset type breakdown
    const assetTypeBreakdown = investmentAssets.reduce((acc, asset) => {
      const existing = acc.find(item => item.asset_type === asset.asset_type);
      if (existing) {
        existing.total_value += asset.total_value;
        existing.count += 1;
      } else {
        acc.push({
          asset_type: asset.asset_type,
          total_value: asset.total_value,
          count: 1
        });
      }
      return acc;
    }, [] as Array<{ asset_type: string; total_value: number; count: number }>);

    // Calculate percentages
    assetTypeBreakdown.forEach(item => {
      item.percentage = totalPortfolioValue > 0 ? (item.total_value / totalPortfolioValue) * 100 : 0;
    });

    // Currency breakdown
    const currencyBreakdown = investmentAssets.reduce((acc, asset) => {
      const existing = acc.find(item => item.currency === asset.currency);
      if (existing) {
        existing.total_value += asset.total_value;
      } else {
        acc.push({
          currency: asset.currency,
          total_value: asset.total_value
        });
      }
      return acc;
    }, [] as Array<{ currency: string; total_value: number }>);

    // Calculate percentages for currency
    currencyBreakdown.forEach(item => {
      item.percentage = totalPortfolioValue > 0 ? (item.total_value / totalPortfolioValue) * 100 : 0;
    });

    // Top and worst performing assets
    const sortedAssets = [...investmentAssets].sort((a, b) => {
      const aReturn = a.cost_basis > 0 ? (a.unrealized_gain_loss / a.cost_basis) * 100 : 0;
      const bReturn = b.cost_basis > 0 ? (b.unrealized_gain_loss / b.cost_basis) * 100 : 0;
      return bReturn - aReturn;
    });

    const topPerformingAsset = sortedAssets[0] ? {
      symbol: sortedAssets[0].symbol,
      name: sortedAssets[0].name,
      gain_loss: sortedAssets[0].unrealized_gain_loss,
      return_percentage: sortedAssets[0].cost_basis > 0 ? (sortedAssets[0].unrealized_gain_loss / sortedAssets[0].cost_basis) * 100 : 0
    } : undefined;

    const worstPerformingAsset = sortedAssets[sortedAssets.length - 1] ? {
      symbol: sortedAssets[sortedAssets.length - 1].symbol,
      name: sortedAssets[sortedAssets.length - 1].name,
      gain_loss: sortedAssets[sortedAssets.length - 1].unrealized_gain_loss,
      return_percentage: sortedAssets[sortedAssets.length - 1].cost_basis > 0 ? (sortedAssets[sortedAssets.length - 1].unrealized_gain_loss / sortedAssets[sortedAssets.length - 1].cost_basis) * 100 : 0
    } : undefined;

    return {
      total_portfolio_value: totalPortfolioValue,
      total_cost_basis: totalCostBasis,
      total_unrealized_gain_loss: totalUnrealizedGainLoss,
      total_realized_gain_loss: totalRealizedGainLoss,
      total_gain_loss: totalGainLoss,
      overall_return_percentage: overallReturnPercentage,
      asset_count: investmentAssets.length,
      transaction_count: investmentTransactions.length,
      top_performing_asset: topPerformingAsset,
      worst_performing_asset: worstPerformingAsset,
      asset_type_breakdown: assetTypeBreakdown,
      currency_breakdown: currencyBreakdown,
      monthly_performance: [] // TODO: Implement monthly performance calculation
    };
  },

  getInvestmentDashboardStats: (): InvestmentDashboardStats => {
    const { investmentAssets, investmentTransactions, investmentGoals } = get();
    
    const totalPortfolioValue = investmentAssets.reduce((sum, asset) => sum + asset.total_value, 0);
    const totalGainLoss = investmentAssets.reduce((sum, asset) => sum + asset.unrealized_gain_loss, 0);
    const totalCostBasis = investmentAssets.reduce((sum, asset) => sum + asset.cost_basis, 0);
    const returnPercentage = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

    // Portfolio allocation
    const portfolioAllocation = investmentAssets.reduce((acc, asset) => {
      const existing = acc.find(item => item.asset_type === asset.asset_type);
      if (existing) {
        existing.total_value += asset.total_value;
        existing.count += 1;
      } else {
        acc.push({
          asset_type: asset.asset_type,
          total_value: asset.total_value,
          count: 1,
          color: '#3B82F6' // Default color, could be enhanced
        });
      }
      return acc;
    }, [] as Array<{ asset_type: string; total_value: number; count: number; color: string }>);

    // Calculate percentages
    portfolioAllocation.forEach(item => {
      item.percentage = totalPortfolioValue > 0 ? (item.total_value / totalPortfolioValue) * 100 : 0;
    });

    // Top assets by performance
    const topAssets = [...investmentAssets]
      .sort((a, b) => b.unrealized_gain_loss - a.unrealized_gain_loss)
      .slice(0, 5)
      .map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        asset_type: asset.asset_type,
        current_value: asset.total_value,
        cost_basis: asset.cost_basis,
        gain_loss: asset.unrealized_gain_loss,
        return_percentage: asset.cost_basis > 0 ? (asset.unrealized_gain_loss / asset.cost_basis) * 100 : 0,
        total_shares: asset.total_shares,
        current_price: asset.current_price,
        currency: asset.currency
      }));

    // Recent transactions
    const recentTransactions = investmentTransactions.slice(0, 5);

    // Goals stats
    const activeGoals = investmentGoals.filter(goal => goal.status === 'active').length;
    const completedGoals = investmentGoals.filter(goal => goal.status === 'completed').length;

    return {
      total_portfolio_value: totalPortfolioValue,
      total_gain_loss: totalGainLoss,
      return_percentage: returnPercentage,
      asset_count: investmentAssets.length,
      active_goals: activeGoals,
      completed_goals: completedGoals,
      recent_transactions: recentTransactions,
      top_assets: topAssets,
      portfolio_allocation: portfolioAllocation
    };
  },
}));