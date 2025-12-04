import { CreditCard, Wallet, PiggyBank, Building } from 'lucide-react';
import { Account } from '../types';

export const getAccountIcon = (type: Account['type']) => {
  switch (type) {
    case 'checking':
      return Building;
    case 'savings':
      return PiggyBank;
    case 'credit':
      return CreditCard;
    case 'investment':
      return Building;
    case 'cash':
      return Wallet;
    default:
      return Wallet;
  }
};

export const getAccountColor = (type: Account['type']) => {
  switch (type) {
    case 'checking':
      return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200';
    case 'savings':
      return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200';
    case 'credit':
      return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200';
    case 'investment':
      return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200';
    case 'cash':
      return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-200';
    default:
      return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200';
  }
}; 

