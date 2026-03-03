import {
  Home,
  CreditCard,
  TrendingUp,
  PieChart,
  Settings,
  ShoppingBag,
  Handshake,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  name: string;
  icon: LucideIcon;
  isNew?: boolean;
}

export const SIDEBAR_NAV: NavItem[] = [
  { id: 'dashboard', name: 'navigation.dashboard', icon: Home },
  { id: 'accounts', name: 'navigation.accounts', icon: CreditCard },
  { id: 'transactions', name: 'navigation.transactions', icon: TrendingUp },
  { id: 'purchases', name: 'navigation.purchases', icon: ShoppingBag },
  { id: 'lent-borrow', name: 'navigation.lendBorrow', icon: Handshake },
  { id: 'clients', name: 'navigation.clients', icon: Users, isNew: true },
  { id: 'analytics', name: 'navigation.analytics', icon: PieChart },
  { id: 'settings', name: 'navigation.settings', icon: Settings },
];
