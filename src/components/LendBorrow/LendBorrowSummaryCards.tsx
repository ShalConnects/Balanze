import React from 'react';
import { LendBorrow } from '../../types';
import { StatCard } from '../Dashboard/StatCard';
import { Handshake, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface LendBorrowSummaryCardsProps {
  filteredRecords: LendBorrow[];
}

export const LendBorrowSummaryCards: React.FC<LendBorrowSummaryCardsProps> = ({
  filteredRecords
}) => {
  // Calculate insights
  const activeRecords = filteredRecords.filter(r => r.status === 'active');
  const settledRecords = filteredRecords.filter(r => r.status === 'settled');
  const overdueRecords = filteredRecords.filter(r => r.status === 'overdue');
  const lendRecords = filteredRecords.filter(r => r.type === 'lend');
  const borrowRecords = filteredRecords.filter(r => r.type === 'borrow');

  // Calculate overdue records (active records past due date)
  const now = new Date();
  const actuallyOverdueRecords = activeRecords.filter(record => {
    const dueDate = new Date(record.due_date);
    return dueDate < now;
  });

  // Calculate total amounts
  const totalLentAmount = lendRecords.reduce((sum, record) => sum + record.amount, 0);
  const totalBorrowedAmount = borrowRecords.reduce((sum, record) => sum + record.amount, 0);
  const totalOverdueAmount = actuallyOverdueRecords.reduce((sum, record) => sum + record.amount, 0);

  // Get currency from first record or default to USD
  const currency = filteredRecords[0]?.currency || 'USD';
  const currencySymbol = {
    USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', ALL: 'L', INR: '₹', CAD: '$', AUD: '$'
  }[currency] || currency;

  // Format amounts
  const formatAmount = (amount: number) => `${currencySymbol}${amount.toLocaleString()}`;

  // Calculate type breakdown
  const typeBreakdown = filteredRecords.reduce((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeInsight = Object.entries(typeBreakdown)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');

  // Calculate status breakdown
  const statusBreakdown = filteredRecords.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusInsight = Object.entries(statusBreakdown)
    .map(([status, count]) => `${count} ${status}`)
    .join(', ');

  // Calculate monthly activity
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const thisMonthRecords = filteredRecords.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });
  
  const lastMonthRecords = filteredRecords.filter(r => {
    const recordDate = new Date(r.date);
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return recordDate.getMonth() === lastMonth && recordDate.getFullYear() === lastMonthYear;
  });
  
  const monthlyChange = lastMonthRecords.length > 0 
    ? Math.round(((thisMonthRecords.length - lastMonthRecords.length) / lastMonthRecords.length) * 100)
    : 0;
  
  const monthlyInsight = monthlyChange !== 0 
    ? `${monthlyChange > 0 ? '+' : ''}${monthlyChange}% vs last month`
    : 'Same as last month';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-3">
      <StatCard
        title="Active Records"
        value={activeRecords.length.toString()}
        icon={<Handshake />}
        color="blue"
        insight={typeInsight || 'No records'}
      />
      
      <StatCard
        title="Settled"
        value={settledRecords.length.toString()}
        icon={<CheckCircle />}
        color="green"
        insight={`${Math.round((settledRecords.length / filteredRecords.length) * 100) || 0}% completion rate`}
      />
      
      <StatCard
        title="Overdue"
        value={actuallyOverdueRecords.length.toString()}
        icon={<AlertTriangle />}
        color="red"
        insight={actuallyOverdueRecords.length > 0 ? `${formatAmount(totalOverdueAmount)} overdue` : 'All up to date'}
      />
      
      <StatCard
        title="Total Lent"
        value={formatAmount(totalLentAmount)}
        icon={<TrendingUp />}
        color="green"
        insight={`${lendRecords.length} records`}
      />
      
      <StatCard
        title="Total Borrowed"
        value={formatAmount(totalBorrowedAmount)}
        icon={<Clock />}
        color="orange"
        insight={`${borrowRecords.length} records`}
      />
    </div>
  );
};
