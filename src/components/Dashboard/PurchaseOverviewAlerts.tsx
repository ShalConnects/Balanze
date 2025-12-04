import React from 'react';
import { AlertTriangle, Clock, DollarSign, TrendingUp, Calendar, Wallet, Tag } from 'lucide-react';
import { Purchase, Account } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface PurchaseOverviewAlertsProps {
  purchases: Purchase[];
  accounts: Account[];
}

export const PurchaseOverviewAlerts: React.FC<PurchaseOverviewAlertsProps> = ({ purchases, accounts }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const lastMonth = new Date(currentYear, currentMonth - 1, 1);
  
  // Calculate alerts
  const alerts = [];

  // 4. Category Spending Alerts
  const categorySpending = purchases
    .filter(p => p.status === 'purchased')
    .reduce((acc, purchase) => {
      const month = new Date(purchase.purchase_date).getMonth();
      const year = new Date(purchase.purchase_date).getFullYear();
      
      if (month === currentMonth && year === currentYear) {
        if (!acc[purchase.category]) {
          acc[purchase.category] = 0;
        }
        acc[purchase.category] += purchase.price;
      }
      return acc;
    }, {} as Record<string, number>);

  // Find categories with high spending (>$500 this month)
  Object.entries(categorySpending).forEach(([category, amount]) => {
    if (amount > 500) {
      alerts.push({
        type: 'category-spending',
        title: 'High Category Spending',
        message: `You've spent ${formatCurrency(amount, 'USD')} on ${category} this month`,
        icon: <Tag className="w-4 h-4 text-purple-600" />,
        color: 'bg-purple-50 border border-purple-200 text-purple-800',
        severity: 'warning'
      });
    }
  });

  // 6. Reminder Alerts (planned purchases approaching their date)
  const upcomingPlanned = purchases.filter(p => {
    if (p.status !== 'planned') return false;
    
    const purchaseDate = new Date(p.purchase_date);
    const daysUntil = Math.ceil((purchaseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntil >= 0 && daysUntil <= 7; // Within next 7 days
  });

  if (upcomingPlanned.length > 0) {
    const nextPurchase = upcomingPlanned.sort((a, b) => 
      new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime()
    )[0];
    
    const daysUntil = Math.ceil((new Date(nextPurchase.purchase_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    alerts.push({
      type: 'reminder',
      title: 'Upcoming Purchase Reminder',
      message: `${nextPurchase.item_name} is scheduled in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
      icon: <Calendar className="w-4 h-4 text-blue-600" />,
      color: 'bg-blue-50 border border-blue-200 text-blue-800',
      severity: 'info'
    });
  }

  // 8. Seasonal Spending Alerts
  const currentMonthSpending = purchases
    .filter(p => {
      const purchaseDate = new Date(p.purchase_date);
      return purchaseDate.getMonth() === currentMonth && 
             purchaseDate.getFullYear() === currentYear &&
             p.status === 'purchased';
    })
    .reduce((sum, p) => sum + p.price, 0);

  const lastMonthSpending = purchases
    .filter(p => {
      const purchaseDate = new Date(p.purchase_date);
      return purchaseDate.getMonth() === lastMonth.getMonth() && 
             purchaseDate.getFullYear() === lastMonth.getFullYear() &&
             p.status === 'purchased';
    })
    .reduce((sum, p) => sum + p.price, 0);

  if (lastMonthSpending > 0) {
    const spendingChange = ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100;
    
    if (spendingChange > 30) {
      alerts.push({
        type: 'seasonal',
        title: 'Spending Increase Alert',
        message: `Your spending is ${Math.abs(spendingChange).toFixed(1)}% higher than last month`,
        icon: <TrendingUp className="w-4 h-4 text-orange-600" />,
        color: 'bg-orange-50 border border-orange-200 text-orange-800',
        severity: 'warning'
      });
    } else if (spendingChange < -30) {
      alerts.push({
        type: 'seasonal',
        title: 'Spending Decrease',
        message: `Your spending is ${Math.abs(spendingChange).toFixed(1)}% lower than last month`,
        icon: <TrendingUp className="w-4 h-4 text-green-600" />,
        color: 'bg-green-50 border border-green-200 text-green-800',
        severity: 'success'
      });
    }
  }

  // 9. Account Balance Alerts
  const totalPlannedValue = purchases
    .filter(p => p.status === 'planned')
    .reduce((sum, p) => sum + p.price, 0);

  const totalAccountBalance = accounts.reduce((sum, account) => sum + account.calculated_balance, 0);
  
  if (totalPlannedValue > 0 && totalAccountBalance > 0) {
    const remainingBalance = totalAccountBalance - totalPlannedValue;
    const balancePercentage = (remainingBalance / totalAccountBalance) * 100;
    
    if (balancePercentage < 20) {
      alerts.push({
        type: 'balance',
        title: 'Low Balance Warning',
        message: `Planned purchases will leave you with only ${formatCurrency(remainingBalance, 'USD')} (${balancePercentage.toFixed(1)}% of balance)`,
        icon: <Wallet className="w-4 h-4 text-red-600" />,
        color: 'bg-red-50 border border-red-200 text-red-800',
        severity: 'critical'
      });
    } else if (balancePercentage < 50) {
      alerts.push({
        type: 'balance',
        title: 'Balance Alert',
        message: `Planned purchases will use ${(100 - balancePercentage).toFixed(1)}% of your account balance`,
        icon: <Wallet className="w-4 h-4 text-yellow-600" />,
        color: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
        severity: 'warning'
      });
    }
  }

  if (alerts.length === 0) {
    return null;
  }

  // Sort alerts by severity (critical > warning > info > success)
  const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
  alerts.sort((a, b) => severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]);

  return (
    <div className="flex flex-wrap gap-3">
      {alerts.slice(0, 3).map((alert, index) => (
        <div
          key={index}
          className={`flex-1 min-w-[220px] max-w-xs p-3 rounded-lg ${alert.color} flex items-start space-x-3`}
          style={{ flexBasis: '30%' }}
        >
          {alert.icon}
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-0.5">{alert.title}</h4>
            <p className="text-xs mt-0.5">{alert.message}</p>
          </div>
        </div>
      ))}
      {alerts.length > 3 && (
        <div className="text-xs text-gray-500 flex items-center">
          +{alerts.length - 3} more alerts
        </div>
      )}
    </div>
  );
}; 

