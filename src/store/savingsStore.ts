import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { SavingsGoal } from '../types';
import { useFinanceStore } from './useFinanceStore';

interface SavingsStore {
  savingsGoals: SavingsGoal[];
  loading: boolean;
  error: string | null;
  fetchSavingsGoals: () => Promise<void>;
  createSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'created_at' | 'current_amount'>) => Promise<void>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  saveSavingsGoal: (goalId: string, amount: number) => Promise<void>;
}

export const useSavingsStore = create<SavingsStore>((set, get) => ({
  savingsGoals: [],
  loading: false,
  error: null,

  fetchSavingsGoals: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
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
      
      // Get accounts from the main finance store
      const accounts = useFinanceStore.getState().accounts;
      const sourceAccount = accounts.find(a => a.id === goal.source_account_id);
      
      // First create a new savings account
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .insert([{
          name: `${goal.name} (Savings)`,
          type: 'savings',
          calculated_balance: 0,
          initial_balance: 0,
          currency: sourceAccount?.currency || 'USD',
          description: goal.description
        }])
        .select()
        .single();

      if (accountError) throw accountError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Then create the savings goal
      const { error: goalError } = await supabase
        .from('savings_goals')
        .insert([{
          name: goal.name,
          target_amount: goal.target_amount,
          target_date: goal.target_date,
          source_account_id: goal.source_account_id,
          savings_account_id: accountData.id,
          user_id: user.id,
          description: goal.description,
          current_amount: 0
        }]);

      if (goalError) throw goalError;

      await get().fetchSavingsGoals();
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
      const now = new Date().toISOString();

      // Create expense transaction for source account
      const { error: sourceError } = await supabase.from('transactions').insert({
        account_id: goal.source_account_id,
        type: 'expense',
        amount,
        description: `Savings: ${goal.name}`,
        category: 'Transfer',
        date: now,
        tags: ['transfer', transferId, goal.savings_account_id, 'savings']
      });

      if (sourceError) throw sourceError;

      // Create income transaction for savings account
      const { error: destError } = await supabase.from('transactions').insert({
        account_id: goal.savings_account_id,
        type: 'income',
        amount,
        description: `Savings: ${goal.name}`,
        category: 'Transfer',
        date: now,
        tags: ['transfer', transferId, goal.source_account_id, 'savings']
      });

      if (destError) throw destError;

      // Update the goal's current amount
      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({ current_amount: goal.current_amount + amount })
        .eq('id', goalId);

      if (updateError) throw updateError;

      await get().fetchSavingsGoals();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to save to goal', loading: false });
    }
  },
})); 