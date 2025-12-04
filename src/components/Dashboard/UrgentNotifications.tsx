import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Calendar, Handshake, ShoppingCart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { LendBorrow } from '../../types/index';
import { formatCurrency } from '../../utils/currency';
import { useTranslation } from 'react-i18next';

interface UrgentNotification {
  id: string;
  type: 'lend_borrow' | 'purchase';
  title: string;
  message: string;
  dueDate: string;
  daysUntil: number;
  amount?: number;
  currency?: string;
  personName?: string;
  itemName?: string;
  priority?: 'low' | 'medium' | 'high';
  status: 'overdue' | 'due_soon' | 'upcoming';
}

const getStatusColor = (status: UrgentNotification['status']) => {
  switch (status) {
    case 'overdue': return 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300';
    case 'due_soon': return 'bg-orange-50 dark:bg-orange-900/40 border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-300';
    case 'upcoming': return 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300';
    default: return 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';
  }
};

const getStatusIcon = (status: UrgentNotification['status']) => {
  switch (status) {
    case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'due_soon': return <Clock className="w-4 h-4 text-orange-600" />;
    case 'upcoming': return <Calendar className="w-4 h-4 text-blue-600" />;
    default: return <Clock className="w-4 h-4 text-gray-600" />;
  }
};

const getTypeIcon = (type: UrgentNotification['type']) => {
  return type === 'lend_borrow' 
    ? <Handshake className="w-4 h-4" />
    : <ShoppingCart className="w-4 h-4" />;
};

const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'high': return 'text-red-600';
    case 'medium': return 'text-orange-600';
    case 'low': return 'text-green-600';
    default: return 'text-gray-600';
  }
};

export const UrgentNotifications: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { purchases } = useFinanceStore();
  const { t } = useTranslation();
  
  // Check if user has Premium plan for Lend & Borrow
  const isPremium = profile?.subscription?.plan === 'premium';
  const [lendBorrowRecords, setLendBorrowRecords] = useState<LendBorrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<UrgentNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch lend/borrow records
        const { data: lbData } = await supabase
          .from('lend_borrow')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'overdue'])
          .order('due_date', { ascending: true });

        setLendBorrowRecords(lbData || []);
      } catch (error) {

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (loading) return;

    const today = new Date();
    const urgentNotifications: UrgentNotification[] = [];

    // Process lend/borrow records (Premium only)
    if (isPremium) {
      lendBorrowRecords.forEach(record => {
      if (!record.due_date) return;

      const dueDate = new Date(record.due_date);
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Only show if due within 7 days or overdue
      if (daysUntil <= 7 || daysUntil < 0) {
        let status: UrgentNotification['status'];
        if (daysUntil < 0) {
          status = 'overdue';
        } else if (daysUntil <= 3) {
          status = 'due_soon';
        } else {
          status = 'upcoming';
        }

        urgentNotifications.push({
          id: record.id,
          type: 'lend_borrow',
          title: `${record.person_name} ${record.type === 'lend' ? t('urgentNotifications.owesYou') : t('urgentNotifications.youOwe')}`,
          message: `${record.type === 'lend' ? t('urgentNotifications.youLent') : t('urgentNotifications.youBorrowed')} ${formatCurrency(record.amount, record.currency)}`,
          dueDate: record.due_date,
          daysUntil,
          amount: record.amount,
          currency: record.currency,
          personName: record.person_name,
          status
        });
      }
    });
    }

    // Process planned purchases
    const plannedPurchases = purchases.filter(p => p.status === 'planned');
    plannedPurchases.forEach(purchase => {
      const purchaseDate = new Date(purchase.purchase_date);
      const daysUntil = Math.ceil((purchaseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Only show if due within 7 days or overdue
      if (daysUntil <= 7 || daysUntil < 0) {
        let status: UrgentNotification['status'];
        if (daysUntil < 0) {
          status = 'overdue';
        } else if (daysUntil <= 3) {
          status = 'due_soon';
        } else {
          status = 'upcoming';
        }

        urgentNotifications.push({
          id: purchase.id,
          type: 'purchase',
          title: t('urgentNotifications.plannedPurchaseDue'),
          message: purchase.item_name,
          dueDate: purchase.purchase_date,
          daysUntil,
          priority: purchase.priority,
          itemName: purchase.item_name,
          status
        });
      }
    });

    // Sort by urgency: overdue first, then by days until due
    urgentNotifications.sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (a.status !== 'overdue' && b.status === 'overdue') return 1;
      return a.daysUntil - b.daysUntil;
    });

    setNotifications(urgentNotifications);
  }, [lendBorrowRecords, purchases, loading]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-lg font-bold text-gray-900 dark:text-white">{t('urgentNotifications.title')}</span>
        </div>
        <div className="text-center text-gray-400 py-8">{t('urgentNotifications.loading')}</div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return null; // Don't show the component if no urgent notifications
  }

  const overdueCount = notifications.filter(n => n.status === 'overdue').length;
  const dueSoonCount = notifications.filter(n => n.status === 'due_soon').length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-lg font-bold text-gray-900 dark:text-white">{t('urgentNotifications.title')}</span>
          {(overdueCount > 0 || dueSoonCount > 0) && (
            <span className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs font-medium px-2 py-1 rounded-full">
              {overdueCount + dueSoonCount}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {notifications.slice(0, 5).map(notification => (
          <div
            key={`${notification.type}-${notification.id}`}
            className={`p-3 rounded-lg border ${getStatusColor(notification.status)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(notification.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getTypeIcon(notification.type)}
                  <h4 className="text-sm font-semibold truncate">
                    {notification.title}
                  </h4>
                  {notification.priority && (
                    <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                      {notification.priority.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-sm mb-1 truncate">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span>
                    {notification.daysUntil < 0 
                      ? t('urgentNotifications.overdueDays', { count: Math.abs(notification.daysUntil) })
                      : notification.daysUntil === 0
                      ? t('urgentNotifications.dueToday')
                      : t('urgentNotifications.dueInDays', { count: notification.daysUntil })
                    }
                  </span>
                  {notification.amount && (
                    <span className="font-medium">
                      {formatCurrency(notification.amount, notification.currency || 'USD')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length > 5 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {t('urgentNotifications.moreNotifications', { count: notifications.length - 5 })}
          </p>
        </div>
      )}
    </div>
  );
}; 

