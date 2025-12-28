import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ArrowRight, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from './StatCard';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/currency';

export const TransferSummaryCard: React.FC = () => {
    const { user } = useAuthStore();
    
    const [transfers, setTransfers] = useState<any[]>([]);
    const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTransferTooltip, setShowTransferTooltip] = useState(false);
    const [showTransferMobileModal, setShowTransferMobileModal] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState<'center' | 'right'>('center');
    const [isHovered, setIsHovered] = useState(false);
    const [showCrossTooltip, setShowCrossTooltip] = useState(false);
    const { isMobile } = useMobileDetection();
    const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const [showTransferWidget, setShowTransferWidget] = useState(() => {
        const saved = localStorage.getItem('showTransferWidget');
        return saved !== null ? JSON.parse(saved) : true;
    });
    
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'showTransferWidget' && e.newValue !== null) {
                setShowTransferWidget(JSON.parse(e.newValue));
            }
        };

        const handleCustomStorageChange = () => {
            const saved = localStorage.getItem('showTransferWidget');
            if (saved !== null) {
                setShowTransferWidget(JSON.parse(saved));
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('showTransferWidgetChanged', handleCustomStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('showTransferWidgetChanged', handleCustomStorageChange);
        };
    }, []);
    
    const tooltipRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user?.id) {
            const loadPreferences = async () => {
                try {
                    const showWidget = await getPreference(user.id, 'showTransferWidget', false);
                    setShowTransferWidget(showWidget);
                    localStorage.setItem('showTransferWidget', JSON.stringify(showWidget));
                } catch (error) {
                    // Keep current localStorage value if database fails
                }
            };
            loadPreferences();
        }
    }, [user?.id]);

    const handleMouseEnter = () => {
        if (!isMobile) {
            setIsHovered(true);
            setShowCrossTooltip(true);
            
            if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current);
            }
            
            tooltipTimeoutRef.current = setTimeout(() => {
                setShowCrossTooltip(false);
            }, 1000);
        }
    };

    const handleMouseLeave = () => {
        if (!isMobile) {
            setIsHovered(false);
            setShowCrossTooltip(false);
            
            if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current);
                tooltipTimeoutRef.current = null;
            }
        }
    };

    useEffect(() => {
        return () => {
            if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current);
            }
        };
    }, []);

    const handleTransferWidgetToggle = async (show: boolean) => {
        localStorage.setItem('showTransferWidget', JSON.stringify(show));
        setShowTransferWidget(show);
        window.dispatchEvent(new CustomEvent('showTransferWidgetChanged'));
        
        if (user?.id) {
            try {
                await setPreference(user.id, 'showTransferWidget', show);
                toast.success('Preference saved!', {
                    description: show ? 'Transfer widget will be shown' : 'Transfer widget hidden'
                });
            } catch (error) {
                toast.error('Failed to save preference', {
                    description: 'Your preference will be saved locally only'
                });
            }
        } else {
            toast.info('Preference saved locally', {
                description: 'Sign in to sync preferences across devices'
            });
        }
    };

    const calculateTooltipPosition = () => {
        if (!tooltipRef.current || !cardRef.current) return;
        
        const tooltip = tooltipRef.current;
        const card = cardRef.current;
        
        const cardRect = card.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        const tooltipRight = cardRect.left + (cardRect.width / 2) + (tooltipRect.width / 2);
        const cardRight = cardRect.right;
        
        if (tooltipRight > cardRight) {
            setTooltipPosition('right');
        } else {
            setTooltipPosition('center');
        }
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

    useEffect(() => {
        if (showTransferTooltip) {
            setTimeout(calculateTooltipPosition, 10);
        }
    }, [showTransferTooltip]);
    
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

    // Get recent transfers (last 3)
    const recentTransfers = useMemo(() => {
        return allTransfers
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);
    }, [allTransfers]);

    if (allTransfers.length === 0) {
        return null;
    }

    if (!showTransferWidget) {
        return null;
    }

    return (
        <div 
            ref={cardRef} 
            className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {(isHovered || isMobile) && (
                <button
                    onClick={() => handleTransferWidgetToggle(false)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                    aria-label="Hide Transfer widget"
                >
                    <X className="w-4 h-4" />
                    {showCrossTooltip && !isMobile && (
                        <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap z-20">
                            Click to hide this widget
                            <div className="absolute -bottom-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                        </div>
                    )}
                </button>
            )}
            
            <div className="flex items-center justify-between mb-2 pr-8">
                <div className="flex items-center gap-2 flex-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Transfers</h2>
                    <div className="relative flex items-center">
                        <button
                            type="button"
                            className="ml-1 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95"
                            onMouseEnter={() => !isMobile && setShowTransferTooltip(true)}
                            onMouseLeave={() => !isMobile && setShowTransferTooltip(false)}
                            onFocus={() => !isMobile && setShowTransferTooltip(true)}
                            onBlur={() => !isMobile && setShowTransferTooltip(false)}
                            onClick={() => {
                                if (isMobile) {
                                    setShowTransferMobileModal(true);
                                } else {
                                    setShowTransferTooltip(v => !v);
                                }
                            }}
                            tabIndex={0}
                            aria-label="Show transfer info"
                        >
                            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200" />
                        </button>
                        {showTransferTooltip && !isMobile && (
                            <div 
                                ref={tooltipRef}
                                className={`absolute top-full z-50 mt-2 w-64 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg p-3 text-xs text-gray-700 dark:text-gray-200 animate-fadein ${
                                    tooltipPosition === 'center' 
                                        ? 'left-1/2 -translate-x-1/2' 
                                        : 'right-0'
                                }`}
                            >
                                <div className="font-semibold mb-1">Transfer Summary:</div>
                                
                                <div className="space-y-1 mb-2">
                                    <div className="text-gray-700 dark:text-gray-200">Currency Exchange ({currencyTransfers})</div>
                                    <div className="text-gray-700 dark:text-gray-200">In-Account ({inAccountTransfers})</div>
                                    <div className="text-gray-700 dark:text-gray-200">DPS Auto-Save ({dpsTransfersCount})</div>
                                </div>
                                
                                {recentTransfers.length > 0 && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                                        <div className="font-semibold mb-1">Recent Transfers:</div>
                                        <ul className="space-y-1">
                                            {recentTransfers.map((transfer, index) => {
                                                const fromName = transfer.fromAccount?.name || 'Unknown';
                                                const toName = transfer.toAccount?.name || 'Unknown';
                                                const currency = transfer.fromCurrency || 'USD';
                                                return (
                                                    <li key={index} className="flex justify-between">
                                                        <span className="truncate max-w-[120px]" title={`${fromName} → ${toName}`}>
                                                            {fromName} → {toName}
                                                        </span>
                                                        <span className="ml-2 tabular-nums">
                                                            {formatCurrency(transfer.fromAmount || 0, currency)}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link 
                        to="/transfers" 
                        className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    >
                        <span>View All</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
            {loading ? (
                <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-0">
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
            )}

            {showTransferMobileModal && isMobile && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowTransferMobileModal(false)} />
                    <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 w-80 max-w-[90vw] animate-fadein">
                        <div className="flex items-center justify-between mb-1">
                            <div className="font-medium text-gray-700 dark:text-gray-200">Transfer Summary:</div>
                            <button
                                onClick={() => setShowTransferMobileModal(false)}
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        
                        <div className="space-y-1 mb-2">
                            <div className="text-xs text-gray-700 dark:text-gray-200">Currency Exchange ({currencyTransfers})</div>
                            <div className="text-xs text-gray-700 dark:text-gray-200">In-Account ({inAccountTransfers})</div>
                            <div className="text-xs text-gray-700 dark:text-gray-200">DPS Auto-Save ({dpsTransfersCount})</div>
                        </div>
                        
                        {recentTransfers.length > 0 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                                <div className="font-medium mb-1 text-xs text-gray-700 dark:text-gray-200">Recent Transfers:</div>
                                <ul className="space-y-1 max-h-32 overflow-y-auto">
                                    {recentTransfers.map((transfer, index) => {
                                        const fromName = transfer.fromAccount?.name || 'Unknown';
                                        const toName = transfer.toAccount?.name || 'Unknown';
                                        const currency = transfer.fromCurrency || 'USD';
                                        return (
                                            <li key={index} className="flex justify-between text-xs text-gray-700 dark:text-gray-200">
                                                <span className="truncate max-w-[120px]" title={`${fromName} → ${toName}`}>
                                                    {fromName} → {toName}
                                                </span>
                                                <span className="ml-2 tabular-nums">
                                                    {formatCurrency(transfer.fromAmount || 0, currency)}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
