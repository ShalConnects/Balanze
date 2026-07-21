import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from './StatCard';
import { usePersistedToggle } from '../../hooks/usePersistedToggle';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/currency';
import { DashboardCardShell } from './DashboardCardShell';

interface TransferSummaryCardProps {
    filterCurrency?: string;
}

export const TransferSummaryCard: React.FC<TransferSummaryCardProps> = ({ 
    filterCurrency: _filterCurrency = '' // Unused - kept for backward compatibility, currency filtering removed
}) => {
    const { user } = useAuthStore();
    
    const [transfers, setTransfers] = useState<any[]>([]);
    const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTransferWidget, setShowTransferWidget] = usePersistedToggle(
      'showTransferWidget',
      true,
      user?.id,
      { syncFromDb: true }
    );

    const hideTransferWidget = () => {
        setShowTransferWidget(false);
        toast.success('Preference saved!', { description: 'Transfer widget hidden' });
    };

    useEffect(() => {
        if (!user) return;
        
        const loadTransferData = async () => {
            setLoading(true);
            try {
                const { data: accountsData } = await supabase
                    .from('accounts')
                    .select('*')
                    .eq('user_id', user.id);
                setAccounts(accountsData || []);

                const { data: transferData } = await supabase
                    .from('transactions')
                    .select('*, account:accounts(name, currency)')
                    .contains('tags', ['transfer'])
                    .order('date', { ascending: false });

                const { data: dpsData } = await supabase
                    .from('dps_transfers')
                    .select(`
                        *,
                        from_account:accounts!from_account_id(name, currency),
                        to_account:accounts!to_account_id(name, currency)
                    `)
                    .order('date', { ascending: false });

                setTransfers(transferData || []);
                setDpsTransfers(dpsData || []);
            } catch (error) {
                console.error('Error loading transfer data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTransferData();
    }, [user]);

    function groupTransfersByTransferId(transfers: any[]) {
        const grouped: Record<string, any[]> = {};
        for (const t of transfers) {
            const transferId = t.tags?.[1];
            if (!transferId) continue;
            if (!grouped[transferId]) grouped[transferId] = [];
            grouped[transferId].push(t);
        }
        return grouped;
    }

    function getCombinedTransfers(transfers: any[], accounts: any[]) {
        const grouped = groupTransfersByTransferId(transfers);
        const combined: any[] = [];
        
        for (const group of Object.values(grouped)) {
            if (group.length < 2) continue;
            const expense = group.find((t: any) => t.type === 'expense');
            const income = group.find((t: any) => t.type === 'income');
            if (!expense || !income) continue;
            
            const fromAccount = accounts.find(a => a.id === expense.account_id);
            const toAccount = accounts.find(a => a.id === income.account_id);
            
            if (!fromAccount || !toAccount) continue;
            
            const exchangeRate = income.amount / expense.amount;
            combined.push({
                id: expense.id + '_' + income.id,
                date: expense.date,
                fromAccount,
                toAccount,
                fromAmount: expense.amount,
                toAmount: income.amount,
                fromCurrency: fromAccount?.currency,
                toCurrency: toAccount?.currency,
                type: fromAccount?.currency === toAccount?.currency ? 'inbetween' : 'currency',
                exchangeRate,
            });
        }
        
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    const combinedTransfers = useMemo(() => {
        return getCombinedTransfers(transfers, accounts);
    }, [transfers, accounts]);

    const processedDpsTransfers = useMemo(() => {
        return dpsTransfers.map(t => ({ 
            ...t, 
            type: 'dps',
            fromAccount: t.from_account,
            toAccount: t.to_account,
            fromAmount: t.amount,
            toAmount: t.amount,
            fromCurrency: t.from_account?.currency,
            toCurrency: t.to_account?.currency,
        }));
    }, [dpsTransfers]);

    const allTransfers = useMemo(() => {
        return [
            ...combinedTransfers,
            ...processedDpsTransfers
        ];
    }, [combinedTransfers, processedDpsTransfers]);


    const totalTransfers = allTransfers.length;
    
    const thisMonthTransfers = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        return allTransfers.filter(transfer => {
            const transferDate = new Date(transfer.date);
            return transferDate >= startOfMonth && transferDate <= endOfMonth;
        }).length;
    }, [allTransfers]);

    const currencyTransfers = allTransfers.filter(t => t.type === 'currency').length;
    const inAccountTransfers = allTransfers.filter(t => t.type === 'inbetween').length;
    const dpsTransfersCount = allTransfers.filter(t => t.type === 'dps').length;

    // Calculate total amounts by type
    const currencyTransfersTotal = useMemo(() => {
        return allTransfers
            .filter(t => t.type === 'currency')
            .reduce((sum, t) => sum + (t.fromAmount || 0), 0);
    }, [allTransfers]);

    const inAccountTransfersTotal = useMemo(() => {
        return allTransfers
            .filter(t => t.type === 'inbetween')
            .reduce((sum, t) => sum + (t.fromAmount || 0), 0);
    }, [allTransfers]);

    const dpsTransfersTotal = useMemo(() => {
        return allTransfers
            .filter(t => t.type === 'dps')
            .reduce((sum, t) => sum + (t.fromAmount || 0), 0);
    }, [allTransfers]);

    // Group transfers by currency for each type
    const currencyTransfersByCurrency = useMemo(() => {
        const grouped: Record<string, number> = {};
        allTransfers
            .filter(t => t.type === 'currency')
            .forEach(t => {
                const currency = t.fromCurrency || 'USD';
                grouped[currency] = (grouped[currency] || 0) + (t.fromAmount || 0);
            });
        return Object.entries(grouped).map(([currency, amount]) => ({ currency, amount }));
    }, [allTransfers]);

    const inAccountTransfersByCurrency = useMemo(() => {
        const grouped: Record<string, number> = {};
        allTransfers
            .filter(t => t.type === 'inbetween')
            .forEach(t => {
                const currency = t.fromCurrency || 'USD';
                grouped[currency] = (grouped[currency] || 0) + (t.fromAmount || 0);
            });
        return Object.entries(grouped).map(([currency, amount]) => ({ currency, amount }));
    }, [allTransfers]);

    const dpsTransfersByCurrency = useMemo(() => {
        const grouped: Record<string, number> = {};
        allTransfers
            .filter(t => t.type === 'dps')
            .forEach(t => {
                const currency = t.fromCurrency || 'USD';
                grouped[currency] = (grouped[currency] || 0) + (t.fromAmount || 0);
            });
        return Object.entries(grouped).map(([currency, amount]) => ({ currency, amount }));
    }, [allTransfers]);

    // Get recent transfers (last 3)
    const recentTransfers = useMemo(() => {
        return allTransfers
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);
    }, [allTransfers]);

    const transferInfoBody = useMemo(
        () => (
            <div className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="min-w-0">
                        <div className="mb-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">
                            Currency Exchange ({currencyTransfers}):
                        </div>
                        {currencyTransfers > 0 ? (
                            <div className="space-y-0.5">
                                {currencyTransfersByCurrency.map(({ currency, amount }) => (
                                    <div
                                        key={currency}
                                        className="break-words bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs"
                                    >
                                        {formatCurrency(amount, currency)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[10px] text-gray-500 sm:text-[11px] dark:text-gray-500">No currency exchanges</div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="mb-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">
                            In-Account ({inAccountTransfers}):
                        </div>
                        {inAccountTransfers > 0 ? (
                            <div className="space-y-0.5">
                                {inAccountTransfersByCurrency.map(({ currency, amount }) => (
                                    <div
                                        key={currency}
                                        className="break-words bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs"
                                    >
                                        {formatCurrency(amount, currency)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[10px] text-gray-500 sm:text-[11px] dark:text-gray-500">No in-account transfers</div>
                        )}
                    </div>
                </div>
                {dpsTransfersCount > 0 && (
                    <div className="min-w-0">
                        <div className="mb-0.5 text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">
                            DPS Auto-Save ({dpsTransfersCount}):
                        </div>
                        <div className="space-y-0.5">
                            {dpsTransfersByCurrency.map(({ currency, amount }) => (
                                <div
                                    key={currency}
                                    className="break-words bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs"
                                >
                                    {formatCurrency(amount, currency)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {recentTransfers.length > 0 && (
                    <>
                        <div className="mt-2 border-t border-gray-200 dark:border-gray-700" />
                        <div>
                            <div className="mb-1">
                                <div className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 sm:text-[11px]">Recent Transfers</div>
                            </div>
                            <ul className="max-h-32 space-y-0.5 overflow-y-auto sm:max-h-40">
                                {recentTransfers.map((transfer, index) => {
                                    const fromName = transfer.fromAccount?.name || 'Unknown';
                                    const toName = transfer.toAccount?.name || 'Unknown';
                                    const currency = transfer.fromCurrency || 'USD';
                                    return (
                                        <li
                                            key={index}
                                            className="flex items-center justify-between rounded py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <span
                                                className="min-w-0 flex-1 truncate text-[10px] text-gray-700 dark:text-gray-300 sm:text-[11px]"
                                                title={`${fromName} → ${toName}`}
                                            >
                                                {fromName} → {toName}
                                            </span>
                                            <span className="ml-2 flex-shrink-0 tabular-nums text-[10px] font-medium text-gray-900 dark:text-gray-100 sm:text-[11px]">
                                                {formatCurrency(transfer.fromAmount || 0, currency)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        ),
        [
            currencyTransfers,
            inAccountTransfers,
            dpsTransfersCount,
            currencyTransfersByCurrency,
            inAccountTransfersByCurrency,
            dpsTransfersByCurrency,
            recentTransfers,
        ]
    );

    if (allTransfers.length === 0) {
        return null;
    }

    if (!showTransferWidget) {
        return null;
    }

    return (
        <DashboardCardShell
            title="Transfers"
            viewAllTo="/transfers"
            onHide={hideTransferWidget}
            hideAriaLabel="Hide Transfer widget"
            info={transferInfoBody}
            infoAriaLabel="Show transfer info"
            loading={loading}
        >
            <div className="dashboard-stat-grid gap-3 sm:gap-4 mb-0 flex-1">
                <div className="w-full relative">
                    <StatCard
                        title="This Month"
                        value={thisMonthTransfers.toString()}
                        color="blue"
                    />
                </div>
                <div className="w-full relative">
                    <StatCard
                        title="Total Transfer"
                        value={totalTransfers.toString()}
                        color="purple"
                    />
                </div>
            </div>
        </DashboardCardShell>
    );
};
