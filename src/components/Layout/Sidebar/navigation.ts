import {
  Home,
  CreditCard,
  TrendingUp,
  PieChart,
  Settings,
  ShoppingBag,
  Handshake,
  Crown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { INVESTMENTS_FEATURE_ICON } from '../../../lib/investmentFeatureIcon';
import { CLIENTS_FEATURE_ICON } from '../../../lib/clientFeatureIcon';

export interface NavItem {
  id: string;
  name: string;
  icon: LucideIcon;
  isNew?: boolean;
  /** Free users see a muted row; tap opens Plans & Usage to upgrade */
  requiresPremium?: boolean;
}

export const SIDEBAR_NAV: NavItem[] = [
  { id: 'dashboard', name: 'navigation.dashboard', icon: Home },
  { id: 'accounts', name: 'navigation.accounts', icon: CreditCard },
  { id: 'transactions', name: 'navigation.transactions', icon: TrendingUp },
  { id: 'purchases', name: 'navigation.purchases', icon: ShoppingBag },
  { id: 'lent-borrow', name: 'navigation.lendBorrow', icon: Handshake },
  { id: 'investments', name: 'navigation.investments', icon: INVESTMENTS_FEATURE_ICON, isNew: true },
  { id: 'clients', name: 'navigation.clients', icon: CLIENTS_FEATURE_ICON, isNew: true },
  { id: 'last-wish', name: 'navigation.lastWish', icon: Crown, requiresPremium: true },
  { id: 'analytics', name: 'navigation.analytics', icon: PieChart },
  { id: 'settings', name: 'navigation.settings', icon: Settings },
];
