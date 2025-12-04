import React from 'react';
import { ArrowRight, DollarSign, TrendingUp, Wallet } from 'lucide-react';

interface TransferSummaryCardsProps {
  transfers: any[];
}

export const TransferSummaryCards: React.FC<TransferSummaryCardsProps> = ({ transfers }) => {
  // Calculate statistics
  const totalTransfers = transfers.length;
  const currencyTransfers = transfers.filter(t => t.type === 'currency').length;
  const dpsTransfers = transfers.filter(t => t.type === 'dps').length;
  const inAccountTransfers = transfers.filter(t => t.type === 'inbetween').length;

  // Calculate total amount transferred
  const totalAmount = transfers.reduce((sum, transfer) => {
    return sum + (transfer.fromAmount || transfer.amount || 0);
  }, 0);

  const cards = [
    {
      title: 'Total Transfers',
      value: totalTransfers,
      icon: ArrowRight,
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Currency Transfers',
      value: currencyTransfers,
      icon: DollarSign,
      color: 'yellow',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      title: 'DPS Transfers',
      value: dpsTransfers,
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'In-Account Transfers',
      value: inAccountTransfers,
      icon: Wallet,
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-600 dark:text-green-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div key={index} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <IconComponent className={`w-5 h-5 ${card.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
