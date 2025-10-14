import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LendBorrowInstallment } from '../../types';
import { format } from 'date-fns';

interface InstallmentListProps {
  lendBorrowId: string;
  currency: string;
}

export const InstallmentList: React.FC<InstallmentListProps> = ({ lendBorrowId, currency }) => {
  const [installments, setInstallments] = useState<LendBorrowInstallment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstallments();
  }, [lendBorrowId]);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lend_borrow_installments')
        .select('*')
        .eq('lend_borrow_id', lendBorrowId)
        .order('installment_number', { ascending: true });

      if (error) throw error;
      setInstallments(data || []);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'partial':
        return 'text-yellow-600 bg-yellow-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch {
      return amount.toString();
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading installments...</div>;
  }

  if (installments.length === 0) {
    return <div className="text-center py-4 text-gray-500">No installments found</div>;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900 dark:text-white">Installments</h4>
      <div className="space-y-2">
        {installments.map((installment) => (
          <div
            key={installment.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(installment.status)}
                <span className="text-sm font-medium">#{installment.installment_number}</span>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(installment.due_date), 'MMM dd, yyyy')}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(installment.amount)}
                </div>
                {installment.paid_amount > 0 && (
                  <div className="text-xs text-gray-500">
                    Paid: {formatCurrency(installment.paid_amount)}
                  </div>
                )}
              </div>
              
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(installment.status)}`}>
                {installment.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
          <span className="font-medium">
            {formatCurrency(installments.reduce((sum, i) => sum + i.amount, 0))}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600 dark:text-gray-400">Total Paid:</span>
          <span className="font-medium">
            {formatCurrency(installments.reduce((sum, i) => sum + i.paid_amount, 0))}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
          <span className="font-medium">
            {formatCurrency(installments.reduce((sum, i) => sum + (i.amount - i.paid_amount), 0))}
          </span>
        </div>
      </div>
    </div>
  );
}; 

