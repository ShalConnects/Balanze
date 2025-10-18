import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowRight, CheckCircle, X, AlertTriangle, Eye, Settings, Calendar, Users, ArrowUpRight, ArrowDownRight, Globe, Check } from 'lucide-react';
import { StatCard } from '../components/Dashboard/StatCard';
import { formatCurrency } from '../utils/currency';
import { FloatingActionButton } from '../components/Layout/FloatingActionButton';
import { TransferModal } from '../components/Transfers/TransferModal';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CurrencyOverviewCard } from '../components/Dashboard/CurrencyOverviewCard';
import { Heart, TrendingUp } from 'lucide-react';
import { NotesAndTodosWidget } from '../components/Dashboard/NotesAndTodosWidget';
import { PurchaseForm } from '../components/Purchases/PurchaseForm';
import { DashboardSkeleton } from '../components/Dashboard/DashboardSkeleton';
import { MotivationalQuote } from '../components/Dashboard/MotivationalQuote';
import { MobileAccordionWidget } from '../components/Dashboard/MobileAccordionWidget';
import { toast } from 'sonner';
import { MainLayout } from '../components/Layout/MainLayout';

// Mock data generators
const generateMockAccounts = () => [
  {
    id: '1',
    name: 'Chase Checking',
    type: 'checking',
    balance: 5420.50,
    currency: 'USD',
    is_active: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '2',
    name: 'Savings Account',
    type: 'savings',
    balance: 12500.00,
    currency: 'USD',
    is_active: true,
    created_at: '2024-01-10T09:15:00Z',
    updated_at: '2024-01-10T09:15:00Z',
    user_id: 'demo-user'
  },
  {
    id: '3',
    name: 'Credit Card',
    type: 'credit',
    balance: -1250.75,
    currency: 'USD',
    is_active: true,
    created_at: '2024-01-20T14:20:00Z',
    updated_at: '2024-01-20T14:20:00Z',
    user_id: 'demo-user'
  },
  {
    id: '4',
    name: 'Investment Portfolio',
    type: 'investment',
    balance: 25000.00,
    currency: 'USD',
    is_active: true,
    created_at: '2024-01-05T11:45:00Z',
    updated_at: '2024-01-05T11:45:00Z',
    user_id: 'demo-user'
  },
  {
    id: '5',
    name: 'BDT Savings',
    type: 'savings',
    balance: 150000.00,
    currency: 'BDT',
    is_active: true,
    has_dps: true,
    created_at: '2024-01-08T12:00:00Z',
    updated_at: '2024-01-08T12:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '6',
    name: 'BDT Checking',
    type: 'checking',
    balance: 25000.00,
    currency: 'BDT',
    is_active: true,
    created_at: '2024-01-12T14:30:00Z',
    updated_at: '2024-01-12T14:30:00Z',
    user_id: 'demo-user'
  }
];

const generateMockTransactions = () => [
  {
    id: '1',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2025-10-15',
    account_id: '1',
    tags: [],
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '2',
    amount: -120.50,
    description: 'Grocery Shopping',
    type: 'expense',
    category: 'Food',
    date: '2025-10-14',
    account_id: '1',
    tags: [],
    created_at: '2024-01-14T16:20:00Z',
    updated_at: '2024-01-14T16:20:00Z',
    user_id: 'demo-user'
  },
  {
    id: '3',
    amount: -85.00,
    description: 'Gas Station',
    type: 'expense',
    category: 'Transportation',
    date: '2025-10-13',
    account_id: '1',
    tags: [],
    created_at: '2024-01-13T08:15:00Z',
    updated_at: '2024-01-13T08:15:00Z',
    user_id: 'demo-user'
  },
  {
    id: '4',
    amount: -250.00,
    description: 'Electric Bill',
    type: 'expense',
    category: 'Utilities',
    date: '2025-10-12',
    account_id: '1',
    tags: [],
    created_at: '2024-01-12T12:00:00Z',
    updated_at: '2024-01-12T12:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '5',
    amount: -45.00,
    description: 'Netflix Subscription',
    type: 'expense',
    category: 'Entertainment',
    date: '2025-10-11',
    account_id: '1',
    tags: [],
    created_at: '2024-01-11T20:30:00Z',
    updated_at: '2024-01-11T20:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '6',
    amount: 500.00,
    description: 'Freelance Payment',
    type: 'income',
    category: 'Freelance',
    date: '2025-10-10',
    account_id: '1',
    tags: [],
    created_at: '2024-01-10T14:45:00Z',
    updated_at: '2024-01-10T14:45:00Z',
    user_id: 'demo-user'
  },
  // BDT Transactions
  {
    id: '7',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2025-10-15',
    account_id: '6',
    tags: [],
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '8',
    amount: -5000.00,
    description: 'Grocery Shopping (BDT)',
    type: 'expense',
    category: 'Food',
    date: '2025-10-14',
    account_id: '6',
    tags: [],
    created_at: '2024-01-14T16:20:00Z',
    updated_at: '2024-01-14T16:20:00Z',
    user_id: 'demo-user'
  },
  {
    id: '9',
    amount: -2000.00,
    description: 'Transportation (BDT)',
    type: 'expense',
    category: 'Transportation',
    date: '2025-10-13',
    account_id: '6',
    tags: [],
    created_at: '2024-01-13T08:15:00Z',
    updated_at: '2024-01-13T08:15:00Z',
    user_id: 'demo-user'
  },
  // Additional USD transactions for historical data
  {
    id: '10',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2023-12-15',
    account_id: '1',
    tags: [],
    created_at: '2023-12-15T10:30:00Z',
    updated_at: '2023-12-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '11',
    amount: -1200.00,
    description: 'Rent Payment',
    type: 'expense',
    category: 'Housing',
    date: '2023-12-08',
    account_id: '1',
    tags: [],
    created_at: '2023-12-08T08:00:00Z',
    updated_at: '2023-12-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '12',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2023-11-15',
    account_id: '1',
    tags: [],
    created_at: '2023-11-15T10:30:00Z',
    updated_at: '2023-11-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '13',
    amount: -1200.00,
    description: 'Rent Payment',
    type: 'expense',
    category: 'Housing',
    date: '2023-11-08',
    account_id: '1',
    tags: [],
    created_at: '2023-11-08T08:00:00Z',
    updated_at: '2023-11-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '14',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2023-10-15',
    account_id: '1',
    tags: [],
    created_at: '2023-10-15T10:30:00Z',
    updated_at: '2023-10-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '15',
    amount: -1200.00,
    description: 'Rent Payment',
    type: 'expense',
    category: 'Housing',
    date: '2023-10-08',
    account_id: '1',
    tags: [],
    created_at: '2023-10-08T08:00:00Z',
    updated_at: '2023-10-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '16',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2023-09-15',
    account_id: '1',
    tags: [],
    created_at: '2023-09-15T10:30:00Z',
    updated_at: '2023-09-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '17',
    amount: -1200.00,
    description: 'Rent Payment',
    type: 'expense',
    category: 'Housing',
    date: '2023-09-08',
    account_id: '1',
    tags: [],
    created_at: '2023-09-08T08:00:00Z',
    updated_at: '2023-09-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '18',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2023-08-15',
    account_id: '1',
    tags: [],
    created_at: '2023-08-15T10:30:00Z',
    updated_at: '2023-08-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '19',
    amount: -1200.00,
    description: 'Rent Payment',
    type: 'expense',
    category: 'Housing',
    date: '2023-08-08',
    account_id: '1',
    tags: [],
    created_at: '2023-08-08T08:00:00Z',
    updated_at: '2023-08-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '20',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2023-07-15',
    account_id: '1',
    tags: [],
    created_at: '2023-07-15T10:30:00Z',
    updated_at: '2023-07-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '21',
    amount: -1200.00,
    description: 'Rent Payment',
    type: 'expense',
    category: 'Housing',
    date: '2023-07-08',
    account_id: '1',
    tags: [],
    created_at: '2023-07-08T08:00:00Z',
    updated_at: '2023-07-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '22',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2023-06-15',
    account_id: '1',
    tags: [],
    created_at: '2023-06-15T10:30:00Z',
    updated_at: '2023-06-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '23',
    amount: -1200.00,
    description: 'Rent Payment',
    type: 'expense',
    category: 'Housing',
    date: '2023-06-08',
    account_id: '1',
    tags: [],
    created_at: '2023-06-08T08:00:00Z',
    updated_at: '2023-06-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '24',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2023-05-15',
    account_id: '1',
    tags: [],
    created_at: '2023-05-15T10:30:00Z',
    updated_at: '2023-05-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '25',
    amount: -1200.00,
    description: 'Rent Payment',
    type: 'expense',
    category: 'Housing',
    date: '2023-05-08',
    account_id: '1',
    tags: [],
    created_at: '2023-05-08T08:00:00Z',
    updated_at: '2023-05-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '26',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2023-04-15',
    account_id: '1',
    tags: [],
    created_at: '2023-04-15T10:30:00Z',
    updated_at: '2023-04-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '27',
    amount: -1200.00,
    description: 'Rent Payment',
    type: 'expense',
    category: 'Housing',
    date: '2023-04-08',
    account_id: '1',
    tags: [],
    created_at: '2023-04-08T08:00:00Z',
    updated_at: '2023-04-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '28',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2023-03-15',
    account_id: '1',
    tags: [],
    created_at: '2023-03-15T10:30:00Z',
    updated_at: '2023-03-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '29',
    amount: -1200.00,
    description: 'Rent Payment',
    type: 'expense',
    category: 'Housing',
    date: '2023-03-08',
    account_id: '1',
    tags: [],
    created_at: '2023-03-08T08:00:00Z',
    updated_at: '2023-03-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '30',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2023-02-15',
    account_id: '1',
    tags: [],
    created_at: '2023-02-15T10:30:00Z',
    updated_at: '2023-02-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '31',
    amount: -1200.00,
    description: 'Rent Payment',
    type: 'expense',
    category: 'Housing',
    date: '2023-02-08',
    account_id: '1',
    tags: [],
    created_at: '2023-02-08T08:00:00Z',
    updated_at: '2023-02-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '32',
    amount: 3500.00,
    description: 'Salary Payment',
    type: 'income',
    category: 'Salary',
    date: '2023-01-15',
    account_id: '1',
    tags: [],
    created_at: '2023-01-15T10:30:00Z',
    updated_at: '2023-01-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '33',
    amount: -1200.00,
    description: 'Rent Payment',
    type: 'expense',
    category: 'Housing',
    date: '2023-01-08',
    account_id: '1',
    tags: [],
    created_at: '2023-01-08T08:00:00Z',
    updated_at: '2023-01-08T08:00:00Z',
    user_id: 'demo-user'
  },
  // Additional BDT transactions for historical data
  {
    id: '34',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2023-12-15',
    account_id: '6',
    tags: [],
    created_at: '2023-12-15T10:30:00Z',
    updated_at: '2023-12-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '35',
    amount: -25000.00,
    description: 'Rent Payment (BDT)',
    type: 'expense',
    category: 'Housing',
    date: '2023-12-08',
    account_id: '6',
    tags: [],
    created_at: '2023-12-08T08:00:00Z',
    updated_at: '2023-12-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '36',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2023-11-15',
    account_id: '6',
    tags: [],
    created_at: '2023-11-15T10:30:00Z',
    updated_at: '2023-11-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '37',
    amount: -25000.00,
    description: 'Rent Payment (BDT)',
    type: 'expense',
    category: 'Housing',
    date: '2023-11-08',
    account_id: '6',
    tags: [],
    created_at: '2023-11-08T08:00:00Z',
    updated_at: '2023-11-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '38',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2023-10-15',
    account_id: '6',
    tags: [],
    created_at: '2023-10-15T10:30:00Z',
    updated_at: '2023-10-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '39',
    amount: -25000.00,
    description: 'Rent Payment (BDT)',
    type: 'expense',
    category: 'Housing',
    date: '2023-10-08',
    account_id: '6',
    tags: [],
    created_at: '2023-10-08T08:00:00Z',
    updated_at: '2023-10-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '40',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2023-09-15',
    account_id: '6',
    tags: [],
    created_at: '2023-09-15T10:30:00Z',
    updated_at: '2023-09-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '41',
    amount: -25000.00,
    description: 'Rent Payment (BDT)',
    type: 'expense',
    category: 'Housing',
    date: '2023-09-08',
    account_id: '6',
    tags: [],
    created_at: '2023-09-08T08:00:00Z',
    updated_at: '2023-09-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '42',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2023-08-15',
    account_id: '6',
    tags: [],
    created_at: '2023-08-15T10:30:00Z',
    updated_at: '2023-08-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '43',
    amount: -25000.00,
    description: 'Rent Payment (BDT)',
    type: 'expense',
    category: 'Housing',
    date: '2023-08-08',
    account_id: '6',
    tags: [],
    created_at: '2023-08-08T08:00:00Z',
    updated_at: '2023-08-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '44',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2023-07-15',
    account_id: '6',
    tags: [],
    created_at: '2023-07-15T10:30:00Z',
    updated_at: '2023-07-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '45',
    amount: -25000.00,
    description: 'Rent Payment (BDT)',
    type: 'expense',
    category: 'Housing',
    date: '2023-07-08',
    account_id: '6',
    tags: [],
    created_at: '2023-07-08T08:00:00Z',
    updated_at: '2023-07-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '46',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2023-06-15',
    account_id: '6',
    tags: [],
    created_at: '2023-06-15T10:30:00Z',
    updated_at: '2023-06-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '47',
    amount: -25000.00,
    description: 'Rent Payment (BDT)',
    type: 'expense',
    category: 'Housing',
    date: '2023-06-08',
    account_id: '6',
    tags: [],
    created_at: '2023-06-08T08:00:00Z',
    updated_at: '2023-06-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '48',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2023-05-15',
    account_id: '6',
    tags: [],
    created_at: '2023-05-15T10:30:00Z',
    updated_at: '2023-05-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '49',
    amount: -25000.00,
    description: 'Rent Payment (BDT)',
    type: 'expense',
    category: 'Housing',
    date: '2023-05-08',
    account_id: '6',
    tags: [],
    created_at: '2023-05-08T08:00:00Z',
    updated_at: '2023-05-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '50',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2023-04-15',
    account_id: '6',
    tags: [],
    created_at: '2023-04-15T10:30:00Z',
    updated_at: '2023-04-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '51',
    amount: -25000.00,
    description: 'Rent Payment (BDT)',
    type: 'expense',
    category: 'Housing',
    date: '2023-04-08',
    account_id: '6',
    tags: [],
    created_at: '2023-04-08T08:00:00Z',
    updated_at: '2023-04-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '52',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2023-03-15',
    account_id: '6',
    tags: [],
    created_at: '2023-03-15T10:30:00Z',
    updated_at: '2023-03-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '53',
    amount: -25000.00,
    description: 'Rent Payment (BDT)',
    type: 'expense',
    category: 'Housing',
    date: '2023-03-08',
    account_id: '6',
    tags: [],
    created_at: '2023-03-08T08:00:00Z',
    updated_at: '2023-03-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '54',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2023-02-15',
    account_id: '6',
    tags: [],
    created_at: '2023-02-15T10:30:00Z',
    updated_at: '2023-02-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '55',
    amount: -25000.00,
    description: 'Rent Payment (BDT)',
    type: 'expense',
    category: 'Housing',
    date: '2023-02-08',
    account_id: '6',
    tags: [],
    created_at: '2023-02-08T08:00:00Z',
    updated_at: '2023-02-08T08:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '56',
    amount: 50000.00,
    description: 'Salary Payment (BDT)',
    type: 'income',
    category: 'Salary',
    date: '2023-01-15',
    account_id: '6',
    tags: [],
    created_at: '2023-01-15T10:30:00Z',
    updated_at: '2023-01-15T10:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '57',
    amount: -25000.00,
    description: 'Rent Payment (BDT)',
    type: 'expense',
    category: 'Housing',
    date: '2023-01-08',
    account_id: '6',
    tags: [],
    created_at: '2023-01-08T08:00:00Z',
    updated_at: '2023-01-08T08:00:00Z',
    user_id: 'demo-user'
  }
];

const generateMockPurchases = () => [
  {
    id: '1',
    name: 'MacBook Pro',
    price: 2499.00,
    status: 'planned',
    category: 'Electronics',
    planned_date: '2024-02-15',
    purchase_date: null,
    notes: 'Need for work',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '2',
    name: 'Winter Jacket',
    price: 150.00,
    status: 'purchased',
    category: 'Clothing',
    planned_date: '2024-01-05',
    purchase_date: '2024-01-12',
    notes: 'Bought on sale',
    created_at: '2024-01-05T09:00:00Z',
    updated_at: '2024-01-12T15:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '3',
    name: 'Gym Membership',
    price: 49.99,
    status: 'purchased',
    category: 'Health',
    planned_date: '2024-01-01',
    purchase_date: '2024-01-01',
    notes: 'Monthly subscription',
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-01T08:00:00Z',
    user_id: 'demo-user'
  }
];

const generateMockDonationSavingRecords = () => [
  {
    id: '1',
    amount: 500.00,
    status: 'donated',
    note: 'Charity donation to local food bank (Currency: USD)',
    transaction_id: null,
    created_at: '2025-10-14T10:00:00Z',
    updated_at: '2024-01-14T10:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '2',
    amount: 200.00,
    status: 'donated',
    note: 'Educational fund donation (Currency: USD)',
    transaction_id: null,
    created_at: '2025-10-10T15:30:00Z',
    updated_at: '2024-01-10T15:30:00Z',
    user_id: 'demo-user'
  },
  {
    id: '3',
    amount: 5000.00,
    status: 'donated',
    note: 'Local mosque donation (Currency: BDT)',
    transaction_id: null,
    created_at: '2025-10-12T09:00:00Z',
    updated_at: '2024-01-12T09:00:00Z',
    user_id: 'demo-user'
  },
  {
    id: '4',
    amount: 10000.00,
    status: 'saved',
    note: 'Emergency fund savings (Currency: BDT)',
    transaction_id: null,
    created_at: '2025-10-08T14:20:00Z',
    updated_at: '2024-01-08T14:20:00Z',
    user_id: 'demo-user'
  }
];

// Mock store hooks
const useMockFinanceStore = () => {
  const accounts = generateMockAccounts();
  const transactions = generateMockTransactions();
  const purchases = generateMockPurchases();
  const donationSavingRecords = generateMockDonationSavingRecords();
  
  const getDashboardStats = () => {
    // Calculate stats by currency
    const currencies = ['USD', 'BDT'];
    const byCurrency = currencies.map(currency => {
      const currencyAccounts = accounts.filter(acc => acc.currency === currency);
      const currencyTransactions = transactions.filter(t => {
        const account = accounts.find(acc => acc.id === t.account_id);
        return account && account.currency === currency;
      });
      
      const totalBalance = currencyAccounts.reduce((sum, acc) => sum + acc.balance, 0);
      const monthlyIncome = currencyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const monthlyExpenses = Math.abs(currencyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0));
      
      return {
        currency,
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        netWorth: totalBalance
      };
    });
    
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const monthlyIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = Math.abs(transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0));
    
    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      netWorth: totalBalance,
      byCurrency
    };
  };

  const getActiveAccounts = () => accounts.filter(acc => acc.is_active);
  const getActiveTransactions = () => transactions;

  return {
    getDashboardStats,
    getActiveAccounts,
    getActiveTransactions,
    accounts,
    transactions,
    purchases,
    donationSavingRecords,
    showTransactionForm: false,
    showAccountForm: false,
    showTransferModal: false,
    showPurchaseForm: false,
    setShowTransactionForm: () => {},
    setShowAccountForm: () => {},
    setShowTransferModal: () => {},
    setShowPurchaseForm: () => {},
    loading: false,
    purchaseCategories: [
      { id: '1', name: 'Electronics', color: '#3B82F6' },
      { id: '2', name: 'Clothing', color: '#EF4444' },
      { id: '3', name: 'Health', color: '#10B981' },
      { id: '4', name: 'Food', color: '#F59E0B' }
    ],
    addPurchase: () => {},
    getMultiCurrencyPurchaseAnalytics: () => ({}),
    fetchTransactions: () => {},
    fetchAccounts: () => {},
    fetchCategories: () => {},
    fetchPurchaseCategories: () => {},
    fetchDonationSavingRecords: () => {},
    fetchPurchases: () => {}
  };
};

const useMockAuthStore = () => ({
  user: {
    id: 'demo-user',
    email: 'demo@balanze.com',
    created_at: '2024-01-01T00:00:00Z'
  },
  profile: {
    id: 'demo-profile',
    user_id: 'demo-user',
    first_name: 'Demo',
    last_name: 'User',
    local_currency: 'USD',
    selected_currencies: ['USD', 'BDT'],
    created_at: '2024-01-01T00:00:00Z'
  }
});

const useMockLoadingContext = () => ({
  wrapAsync: (fn: any) => fn(),
  setLoadingMessage: () => {},
  isLoading: false,
  loadingMessage: ''
});

// Mock LastWishCountdownWidget component
const MockLastWishCountdownWidget: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Mock countdown data
  const mockCountdown = {
    daysLeft: 3,
    nextCheckIn: '2024-01-20',
    isOverdue: false,
    urgencyLevel: 'critical' as const,
    progressPercentage: 85,
    timeLeft: {
      hours: 12,
      minutes: 30,
      seconds: 45
    },
    isFinalHour: false
  };

  const colors = {
    bg: 'bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-orange-900/40 dark:via-gray-900 dark:to-orange-900/20',
    border: 'border-orange-400 dark:border-orange-600',
    text: 'text-orange-900 dark:text-orange-100',
    icon: 'text-orange-500',
    progress: 'bg-orange-500'
  };

  return (
    <div className="mb-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative">
      {/* Premium Badge */}
      <div className="absolute top-2 right-2">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <span>⭐</span>
          <span>PREMIUM</span>
        </div>
      </div>

      <div className={`${colors.bg} rounded-2xl shadow-xl p-5 border-2 ${colors.border} transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] animate-slide-in`}>
        {/* Header */}
        <div className="mb-4">
          {/* Top row: Icon, Title, and Eye button */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <AlertTriangle className="w-6 h-6 text-orange-500 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <h3 className={`font-bold text-lg ${colors.text}`}>
                Last Wish Check-in
              </h3>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors duration-200"
            >
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Second row: Status and countdown */}
          <div className="flex flex-col gap-3">
            {/* Single status indicator */}
            <div className="flex items-center justify-center">
              <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full animate-pulse shadow-lg">
                URGENT
              </span>
            </div>
            
            {/* Countdown display */}
            <div className="text-center">
              <p className={`text-2xl font-bold ${colors.text} mb-1`}>
                {mockCountdown.daysLeft} days
              </p>
              <p className={`text-sm ${colors.text} opacity-80`}>
                until check-in
              </p>
              <p className={`text-sm font-medium ${colors.text} mt-1`}>
                Stay active to keep your data safe
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(mockCountdown.progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ease-out ${colors.progress} progress-animate`}
              style={{ 
                width: `${mockCountdown.progressPercentage}%`,
                '--progress-width': `${mockCountdown.progressPercentage}%`
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-4">
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gray-400 text-white cursor-not-allowed opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Check In Now
          </button>
          <button
            onClick={() => window.location.href = '/settings'}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Details Section */}
        {showDetails && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Next Check-in:</span>
              </div>
              <div className="text-right font-medium text-gray-900 dark:text-white">
                {mockCountdown.nextCheckIn}
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Recipients:</span>
              </div>
              <div className="text-right">
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                >
                  Manage
                </button>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => window.location.href = '/settings'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <ArrowRight className="w-4 h-4" />
                View Full Settings
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Mock RecentTransactions component
const MockRecentTransactions: React.FC = () => {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(Math.abs(amount));
  };

  // Mock recent transactions data
  const mockRecentTransactions = [
    {
      id: '1',
      description: 'Salary Payment',
      type: 'income',
      amount: 3500.00,
      date: '2025-01-15',
      created_at: '2025-01-15T10:30:00Z',
      account_id: '1'
    },
    {
      id: '2',
      description: 'Grocery Shopping',
      type: 'expense',
      amount: -120.50,
      date: '2025-01-14',
      created_at: '2025-01-14T16:20:00Z',
      account_id: '1'
    },
    {
      id: '3',
      description: 'Gas Station',
      type: 'expense',
      amount: -85.00,
      date: '2025-01-13',
      created_at: '2025-01-13T08:15:00Z',
      account_id: '1'
    },
    {
      id: '4',
      description: 'Electric Bill',
      type: 'expense',
      amount: -250.00,
      date: '2025-01-12',
      created_at: '2025-01-12T12:00:00Z',
      account_id: '1'
    },
    {
      id: '5',
      description: 'Netflix Subscription',
      type: 'expense',
      amount: -45.00,
      date: '2025-01-11',
      created_at: '2025-01-11T20:30:00Z',
      account_id: '1'
    }
  ];

  const mockAccounts = [
    { id: '1', name: 'Chase Checking', currency: 'USD' },
    { id: '2', name: 'Savings Account', currency: 'USD' },
    { id: '3', name: 'Credit Card', currency: 'USD' }
  ];

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <div className="space-y-0 pb-4">
        {mockRecentTransactions.map((transaction) => {
          const account = mockAccounts.find(a => a.id === transaction.account_id);
          const currency = account?.currency || 'USD';
          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-2 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {transaction.type === 'income' ? (
                    <ArrowDownRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount, currency)}
                </p>
                <p className="text-xs text-gray-500">{account?.name || 'Unknown Account'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Mock LendBorrowSummaryCard component
const MockLendBorrowSummaryCard: React.FC<{ t: any; formatCurrency: any }> = ({ t, formatCurrency }) => {
  const [filterCurrency, setFilterCurrency] = useState('USD');
  
  // Mock data for lent & borrow
  const mockLendBorrowRecords = [
    {
      id: '1',
      person_name: 'John Smith',
      amount: 500.00,
      type: 'lend',
      status: 'active',
      currency: 'USD',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      person_name: 'Sarah Johnson',
      amount: 250.00,
      type: 'borrow',
      status: 'active',
      currency: 'USD',
      created_at: '2024-01-10T14:20:00Z'
    },
    {
      id: '3',
      person_name: 'Mike Wilson',
      amount: 1000.00,
      type: 'lend',
      status: 'active',
      currency: 'USD',
      created_at: '2024-01-08T09:15:00Z'
    }
  ];

  // Filter records by currency
  const filteredRecords = mockLendBorrowRecords.filter(r => r.currency === filterCurrency);

  // Group by person for tooltips (only active records)
  const lentByPerson = filteredRecords
    .filter(r => r.type === 'lend' && r.status === 'active')
    .reduce((acc, record) => {
      const person = record.person_name || 'Unknown';
      acc[person] = (acc[person] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

  const borrowedByPerson = filteredRecords
    .filter(r => r.type === 'borrow' && r.status === 'active')
    .reduce((acc, record) => {
      const person = record.person_name || 'Unknown';
      acc[person] = (acc[person] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalActiveLent = Object.values(lentByPerson).reduce((sum, amt) => sum + amt, 0);
  const totalActiveBorrowed = Object.values(borrowedByPerson).reduce((sum, amt) => sum + amt, 0);

  // Currency options
  const currencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'BDT', label: 'BDT' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'JPY', label: 'JPY' },
    { value: 'CAD', label: 'CAD' },
    { value: 'AUD', label: 'AUD' },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative">
      {/* Premium Badge */}
      <div className="absolute top-2 right-2">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <span>⭐</span>
          <span>PREMIUM</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4 pr-20">
        <div className="flex items-center gap-2 flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lent & Borrow</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Currency Filter */}
          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className="bg-transparent border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {currencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="text-sm font-medium flex items-center space-x-1 text-gray-400 cursor-not-allowed">
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 mb-6">
        <div className="w-full relative">
          <StatCard
            title="Total Lent"
            value={formatCurrency(totalActiveLent, filterCurrency)}
            color="green"
          />
        </div>
        <div className="w-full relative">
          <StatCard
            title="Total Borrowed"
            value={formatCurrency(totalActiveBorrowed, filterCurrency)}
            color="red"
          />
        </div>
      </div>

    </div>
  );
};

// Mock DonationSavingsOverviewCard component
const MockDonationSavingsOverviewCard: React.FC<{ t: any; formatCurrency: any }> = ({ t, formatCurrency }) => {
  const accounts = generateMockAccounts();
  const transactions = generateMockTransactions();
  const donationSavingRecords = generateMockDonationSavingRecords();
  const [filterCurrency, setFilterCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);

  // Get all unique currencies from accounts
  const recordCurrencies = Array.from(new Set(accounts.map(a => a.currency)));

  // Set default currency filter
  useEffect(() => {
    if (!filterCurrency && recordCurrencies.length > 0) {
      setFilterCurrency(recordCurrencies[0]);
    }
  }, [recordCurrencies, filterCurrency]);

  // Calculate totalDonated using the same logic as Donations page
  const totalDonated = useMemo(() => {
    return donationSavingRecords
      .filter(record => {
        if (record.status !== 'donated') return false;
        
        // Check currency
        if (!record.transaction_id) {
          const currencyMatch = record.note?.match(/\(?Currency:\s*([A-Z]{3})\)?/);
          const manualCurrency = currencyMatch ? currencyMatch[1] : 'USD';
          return manualCurrency === filterCurrency;
        }
        
        const transaction = transactions.find(t => t.id === record.transaction_id);
        const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
        return account && account.currency === filterCurrency;
      })
      .reduce((sum, record) => sum + record.amount, 0);
  }, [donationSavingRecords, accounts, transactions, filterCurrency]);

  // Calculate totalSaved using the same logic as Donations page
  const totalSaved = useMemo(() => {
    return donationSavingRecords
      .filter(record => {
        if (record.status !== 'saved') return false;
        
        // Check currency
        if (!record.transaction_id) {
          const currencyMatch = record.note?.match(/\(?Currency:\s*([A-Z]{3})\)?/);
          const manualCurrency = currencyMatch ? currencyMatch[1] : 'USD';
          return manualCurrency === filterCurrency;
        }
        
        const transaction = transactions.find(t => t.id === record.transaction_id);
        const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
        return account && account.currency === filterCurrency;
      })
      .reduce((sum, record) => sum + record.amount, 0);
  }, [donationSavingRecords, accounts, transactions, filterCurrency]);

  // Calculate monthly donations
  const monthlyDonations = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return donationSavingRecords.filter(record => {
      if (record.status !== 'donated') return false;
      
      const recordDate = new Date(record.created_at);
      if (recordDate < startOfMonth || recordDate > endOfMonth) return false;
      
      // Check currency
      if (!record.transaction_id) {
        const currencyMatch = record.note?.match(/\(?Currency:\s*([A-Z]{3})\)?/);
        const manualCurrency = currencyMatch ? currencyMatch[1] : 'USD';
        return manualCurrency === filterCurrency;
      }
      
      const transaction = transactions.find(t => t.id === record.transaction_id);
      const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
      return account && account.currency === filterCurrency;
    }).length;
  }, [donationSavingRecords, accounts, transactions, filterCurrency]);

  // Calculate active savings goals (DPS accounts)
  const activeSavingsGoals = useMemo(() => {
    return accounts.filter(acc => acc.has_dps && acc.currency === filterCurrency).length;
  }, [accounts, filterCurrency]);

  // Currency options
  const currencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'BDT', label: 'BDT' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'JPY', label: 'JPY' },
    { value: 'CAD', label: 'CAD' },
    { value: 'AUD', label: 'AUD' },
  ];

  // Don't render the card if there are no donation/savings records and no DPS accounts
  const hasDpsAccounts = accounts.some(a => a.has_dps && a.currency === filterCurrency);
  const hasDonationRecords = donationSavingRecords.some(record => {
    if (!record.transaction_id) {
      const currencyMatch = record.note?.match(/\(?Currency:\s*([A-Z]{3})\)?/);
      const manualCurrency = currencyMatch ? currencyMatch[1] : 'USD';
      return manualCurrency === filterCurrency;
    }
    const transaction = transactions.find(t => t.id === record.transaction_id);
    const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
    return account && account.currency === filterCurrency;
  });

  if (!hasDpsAccounts && !hasDonationRecords) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Donations & Savings</h2>
        <select
          value={filterCurrency}
          onChange={(e) => setFilterCurrency(e.target.value)}
          className="bg-transparent border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {currencyOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        <div className="w-full">
          <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center mb-2">
              <Heart className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Donated</span>
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalDonated, filterCurrency || 'USD')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {monthlyDonations > 0 ? `${monthlyDonations} donations this month` : 'No donations this month'}
            </div>
          </div>
        </div>
        <div className="w-full">
          <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Saved</span>
            </div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalSaved, filterCurrency || 'USD')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {activeSavingsGoals > 0 ? `${activeSavingsGoals} active goals` : 'No active savings goals'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DashboardProps {
  onViewChange: (view: string) => void;
}

export const DashboardDemoOnly: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { 
    getDashboardStats, 
    getActiveAccounts, 
    getActiveTransactions, 
    showTransactionForm, 
    showAccountForm, 
    showTransferModal, 
    setShowTransactionForm, 
    setShowAccountForm, 
    setShowTransferModal,
    loading: storeLoading,
    showPurchaseForm,
    setShowPurchaseForm,
    purchaseCategories,
    accounts,
    addPurchase
  } = useMockFinanceStore();
  
  // Use local loading state for dashboard instead of global store loading
  // Initialize with true to prevent flash of empty state
  const [dashboardLoading, setDashboardLoading] = useState(true);
  // Track if initial data fetch has completed
  const [initialDataFetched, setInitialDataFetched] = useState(false);
  
  // Memoize store functions to prevent infinite loops
  const fetchTransactions = useCallback(() => {
    // Mock implementation
  }, []);

  const fetchAccounts = useCallback(() => {
    // Mock implementation
  }, []);

  const fetchCategories = useCallback(() => {
    // Mock implementation
  }, []);

  const fetchPurchaseCategories = useCallback(() => {
    // Mock implementation
  }, []);

  const fetchDonationSavingRecords = useCallback(() => {
    // Mock implementation
  }, []);
  
  const { wrapAsync, setLoadingMessage } = useMockLoadingContext();
  const { user } = useMockAuthStore();
  
  const stats = getDashboardStats();
  const activeAccounts = getActiveAccounts();
  const transactions = getActiveTransactions();
  const allTransactions = transactions; // Get all transactions, not just active ones
  
  const [selectedCurrency, setSelectedCurrency] = useState(stats.byCurrency[0]?.currency || 'USD');
  const [showMultiCurrencyAnalytics, setShowMultiCurrencyAnalytics] = useState(true);
  const [showPurchasesWidget, setShowPurchasesWidget] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Load user preferences for multi-currency analytics
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          setShowMultiCurrencyAnalytics(true);
        } catch (error) {
          console.error('Error loading user preferences:', error);
          setShowMultiCurrencyAnalytics(true); // Default to showing
        }
      };
      loadPreferences();
    }
  }, [user?.id]);

  // Load user preferences for purchases widget
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          setShowPurchasesWidget(true);
        } catch (error) {
          console.error('Error loading purchases widget preferences:', error);
          setShowPurchasesWidget(true); // Default to showing
        }
      };
      loadPreferences();
    }
  }, [user?.id]);

  // Save Multi-Currency Analytics visibility preference to database
  const handleMultiCurrencyAnalyticsToggle = async (show: boolean) => {
    if (user?.id) {
      try {
        setShowMultiCurrencyAnalytics(show);
        toast.success('Preference saved!', {
          description: show ? 'Multi-currency analytics will be shown' : 'Multi-currency analytics hidden'
        });
      } catch (error) {
        console.error('Error saving user preferences:', error);
        setShowMultiCurrencyAnalytics(show);
        toast.error('Failed to save preference', {
          description: 'Your preference will be saved locally only'
        });
      }
    } else {
      setShowMultiCurrencyAnalytics(show);
      toast.info('Preference saved locally', {
        description: 'Sign in to sync preferences across devices'
      });
    }
  };

  // Save Purchases widget visibility preference to database
  const handlePurchasesWidgetToggle = async (show: boolean) => {
    if (user?.id) {
      try {
        setShowPurchasesWidget(show);
        toast.success('Preference saved!', {
          description: show ? 'Purchases widget will be shown' : 'Purchases widget hidden'
        });
      } catch (error) {
        console.error('Error saving purchases widget preferences:', error);
        setShowPurchasesWidget(show);
        toast.error('Failed to save preference', {
          description: 'Your preference will be saved locally only'
        });
      }
    } else {
      setShowPurchasesWidget(show);
      toast.info('Preference saved locally', {
        description: 'Sign in to sync preferences across devices'
      });
    }
  };

  // Get purchase analytics
  const purchaseAnalytics = {};
  const purchases = generateMockPurchases();
  
  // Calculate purchase overview stats
  const totalPlannedPurchases = purchases.filter(p => p.status === 'planned').length;
  const totalPurchasedItems = purchases.filter(p => p.status === 'purchased').length;
  const totalCancelledItems = purchases.filter(p => p.status === 'cancelled').length;
  const totalPlannedValue = purchases
    .filter(p => p.status === 'planned')
    .reduce((sum, p) => sum + p.price, 0);
  const recentPurchases = purchases
    .filter(p => p.status === 'purchased')
    .sort((a, b) => new Date(b.purchase_date || '').getTime() - new Date(a.purchase_date || '').getTime())
    .slice(0, 5);

  // Responsive state detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 767);
      setIsTablet(width > 767 && width <= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch purchases data when dashboard loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mock implementation
      } catch (error) {
        console.error('Error fetching purchases:', error);
      }
    };
    fetchData();
  }, []);

  // Initial data fetch when dashboard loads
  useEffect(() => {
    const refreshData = async () => {
      try {
        if (!user) {
          console.log('User not authenticated yet, skipping data fetch');
          setDashboardLoading(false);
          setInitialDataFetched(true);
          return;
        }

        setDashboardLoading(true);
        // setLoadingMessage('Loading dashboard data...');

        await Promise.all([
          fetchTransactions(),
          fetchAccounts(),
          fetchCategories(),
          fetchPurchaseCategories(),
          fetchDonationSavingRecords()
        ]);

        setDashboardLoading(false);
        setInitialDataFetched(true);
        // setLoadingMessage('');

      } catch (error) {
        console.error('Error refreshing dashboard data:', error);
        setDashboardLoading(false);
        setInitialDataFetched(true);
        // setLoadingMessage('');
      }
    };
    
    if (user && !initialDataFetched) {
      refreshData();
    }
  }, [user, initialDataFetched, setLoadingMessage]);

  // Force loading state to false after a timeout to prevent infinite loading
  useEffect(() => {
    if (dashboardLoading && user) {
      const timeoutId = setTimeout(() => {
        console.log('Dashboard: Force clearing loading state after timeout');
        setDashboardLoading(false);
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [dashboardLoading, user]);

  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(t => t.type === 'income' && !(t.tags && t.tags.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'))))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && !(t.tags && t.tags.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'))))
    .reduce((sum, t) => sum + t.amount, 0);

  // Use the raw accounts array from the store
  const rawAccounts = accounts;
  
  // Calculate spending breakdown data for pie chart
  const getSpendingBreakdown = () => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const expenses = transactions.filter(t => 
      t.type === 'expense' && 
      new Date(t.date) >= last30Days &&
      !(t.tags && t.tags.some(tag => tag.includes('transfer') || tag.includes('dps_transfer')))
    );

    const categoryTotals = expenses.reduce((acc, transaction) => {
      const category = transaction.category || 'Other';
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    }));
  };

  // Calculate monthly trends data for line chart
  const getMonthlyTrends = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        income: 0,
        expenses: 0
      };
    }).reverse();

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const monthIndex = last6Months.findIndex(m => 
        new Date().getMonth() - (5 - last6Months.indexOf(m)) === transactionDate.getMonth()
      );
      
      if (monthIndex !== -1) {
        if (transaction.type === 'income') {
          last6Months[monthIndex].income += transaction.amount;
        } else if (transaction.type === 'expense') {
          last6Months[monthIndex].expenses += transaction.amount;
        }
      }
    });

    return last6Months;
  };

  const spendingData = getSpendingBreakdown();
  const trendsData = getMonthlyTrends();
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

  const [submittingPurchase, setSubmittingPurchase] = React.useState(false);
  const handlePurchaseSubmit = async () => {
    setSubmittingPurchase(true);
    try {
      await addPurchase();
      setShowPurchaseForm(false);
    } finally {
      setSubmittingPurchase(false);
    }
  };

  // Show loading skeleton while data is being fetched or until initial fetch completes
  if (dashboardLoading || !initialDataFetched) {
    return (
      <>
        <DashboardSkeleton />
        <FloatingActionButton />
      </>
    );
  }

  return (
    <>

      {/* Main Dashboard Content */}
      <div data-tour="dashboard" className="flex flex-col lg:flex-row gap-6">
        {/* Main Content - Full width on mobile, flex-1 on desktop */}
        <div className="flex-1 space-y-6">


          {/* Multi-Currency Quick Access */}
          {stats.byCurrency.length > 1 && showMultiCurrencyAnalytics && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700 relative">
              <button
                onClick={() => handleMultiCurrencyAnalyticsToggle(false)}
                className="absolute top-1/2 right-2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                aria-label="Close Multi-Currency Analytics"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-between pr-8">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    Multi-Currency Analytics
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    You have {stats.byCurrency.length} currencies. Get detailed insights and comparisons.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/currency-analytics')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>View Analytics</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Currency Sections & Donations & Savings - Responsive grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 gap-4 lg:gap-6">
            {stats.byCurrency.map(({ currency }) => (
              <div key={currency} className="w-full">
                <CurrencyOverviewCard
                  currency={currency}
                  transactions={allTransactions}
                  accounts={rawAccounts}
                  t={t}
                  formatCurrency={formatCurrency}
                />
              </div>
            ))}
            {/* Donations & Savings Overview Card - Place after currency cards */}
            <div className="w-full">
              <MockDonationSavingsOverviewCard
                t={t}
                formatCurrency={formatCurrency}
              />
            </div>
            
          </div>

          {/* Purchase Overview & Lend & Borrow Summary Row - Responsive grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 gap-4 lg:gap-6">
            {/* Purchase Overview */}
            {purchases.length > 0 && showPurchasesWidget && (
              <div className="w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative">
                {/* Hide button */}
                <button
                  onClick={() => handlePurchasesWidgetToggle(false)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Hide Purchases widget"
                  title="Hide Purchases widget"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center justify-between mb-4 pr-8">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Purchases</h2>
                  <div className="text-sm font-medium flex items-center space-x-1 text-gray-400 cursor-not-allowed">
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                {/* Purchase Stats Cards - Responsive grid */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 lg:gap-4 mb-6">
                  <StatCard
                    title="Planned Purchases"
                    value={totalPlannedPurchases.toString()}
                    color="yellow"
                  />
                  <StatCard
                    title="Purchased Items"
                    value={totalPurchasedItems.toString()}
                    trend="up"
                    color="red"
                  />
                </div>
              </div>
            )}
            {/* Lend & Borrow Summary Card */}
            <div className="w-full">
              <MockLendBorrowSummaryCard
                t={t}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>

          {/* Motivational Quote - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <MotivationalQuote />
          </div>

          {/* Recent Transactions - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard.recentTransactions')}</h2>
              <div className="text-sm font-medium flex items-center space-x-1 text-gray-400 cursor-not-allowed">
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
            <MockRecentTransactions />
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block w-72 space-y-6">
          <MockLastWishCountdownWidget />
          <NotesAndTodosWidget />
        </div>

        {/* Mobile Bottom Section - Accordion Layout */}
        <div className="lg:hidden dashboard-mobile-container">
          <MobileAccordionWidget 
            isDemo={true}
            MockLastWishCountdownWidget={MockLastWishCountdownWidget}
            MockRecentTransactions={MockRecentTransactions}
          />
        </div>

        <FloatingActionButton />
      </div>

      {/* Demo Footer */}
      <div className="mt-12 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Create Your Own Dashboard?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            This demo shows you exactly what Balanze can do. Sign up now to start tracking your real finances with unlimited accounts, transactions, and advanced analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.location.href = '/register'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 w-full sm:w-auto"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-transparent border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Back to Landing Page</span>
              <span className="sm:hidden">Back to Landing</span>
            </button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="hidden sm:inline">No credit card required</span>
              <span className="sm:hidden">No credit card</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Feature Highlights */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900 dark:text-green-100">Real-time Analytics</h4>
              <p className="text-green-700 dark:text-green-300 text-sm">Live spending insights</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Multi-Currency</h4>
              <p className="text-blue-700 dark:text-blue-300 text-sm">USD, BDT & more</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900 dark:text-purple-100">Last Wish</h4>
              <p className="text-purple-700 dark:text-purple-300 text-sm">Digital legacy planning</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals - Consolidated at the end to prevent multiple instances */}
      {/* TransactionForm is handled by FloatingActionButton to prevent conflicts */}

      {showTransferModal && (
        <TransferModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />
      )}

      {showPurchaseForm && (
        <PurchaseForm 
          isOpen={showPurchaseForm} 
          onClose={() => setShowPurchaseForm(false)}
        />
      )}
    </>
  );
};

// Main component that wraps with MainLayout
const DashboardDemoOnlyPage: React.FC = () => {
  return (
    <MainLayout>
      <DashboardDemoOnly onViewChange={() => {}} />
    </MainLayout>
  );
};

export default DashboardDemoOnlyPage;
