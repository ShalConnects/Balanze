import React from 'react';
import { AlertTriangle, Clock, DollarSign, ShoppingCart } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/currency';

export const PurchaseNotifications: React.FC = () => {
  const { purchases, accounts } = useFinanceStore();
  
  // Get current date
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Calculate notifications
  const overduePlanned = purchases.filter(p => 
    p.status === 'planned' && 
    new Date(p.purchase_date) < today
  );
  
  const highPriorityPlanned = purchases.filter(p => 
    p.status === 'planned' && 
    p.priority === 'high'
  );
  
  // Calculate monthly budget impact
  const monthlyPurchases = purchases.filter(p => {
    const purchaseDate = new Date(p.purchase_date);
    return purchaseDate.getMonth() === currentMonth && 
           purchaseDate.getFullYear() === currentYear &&
           p.status === 'purchased';
  });
  
  const totalMonthlySpent = monthlyPurchases.reduce((sum, p) => sum + p.price, 0);
  const totalPlannedValue = purchases
    .filter(p => p.status === 'planned')
    .reduce((sum, p) => sum + p.price, 0);
  
  // Get account balances for budget comparison
  const totalAccountBalance = accounts.reduce((sum, account) => sum + account.calculated_balance, 0);
  const budgetWarning = totalPlannedValue > totalAccountBalance * 0.5; // Warning if planned > 50% of balance
  
  const notifications = [];
  
  if (overduePlanned.length > 0) {
    notifications.push({
      type: 'overdue',
      title: 'Overdue Planned Purchases',
      message: `${overduePlanned.length} planned purchase(s) past their date`,
      icon: <Clock className="w-5 h-5 text-red-600" />,
      color: 'bg-red-50 border-red-200 text-red-800',
      items: overduePlanned.slice(0, 3)
    });
  }
  
  if (highPriorityPlanned.length > 0) {
    notifications.push({
      type: 'high-priority',
      title: 'High Priority Items',
      message: `${highPriorityPlanned.length} high priority purchase(s) planned`,
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      items: highPriorityPlanned.slice(0, 3)
    });
  }
  
  if (budgetWarning) {
    notifications.push({
      type: 'budget',
      title: 'Budget Alert',
      message: `Planned purchases (${formatCurrency(totalPlannedValue, 'USD')}) exceed 50% of account balance`,
      icon: <DollarSign className="w-5 h-5 text-orange-600" />,
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      items: []
    });
  }
  
  if (notifications.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
        <ShoppingCart className="w-4 h-4" />
        <span>Purchase Alerts</span>
      </h3>
      
      {notifications.map((notification, index) => (
        <div key={index} className={`p-3 rounded-lg border ${notification.color} dark:bg-opacity-20`}>
          <div className="flex items-start space-x-3">
            {notification.icon}
            <div className="flex-1">
              <h4 className="text-sm font-medium">{notification.title}</h4>
              <p className="text-xs mt-1">{notification.message}</p>
              
              {notification.items.length > 0 && (
                <div className="mt-2 space-y-1">
                  {notification.items.map((item) => (
                    <div key={item.id} className="text-xs flex justify-between items-center">
                      <span className="truncate">{item.item_name}</span>
                      <span className="text-xs opacity-75">
                        {formatCurrency(item.price, item.currency)}
                      </span>
                    </div>
                  ))}
                  {notification.items.length < notification.items.length && (
                    <div className="text-xs opacity-75">
                      +{notification.items.length - 3} more...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 

