import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { formatAppDate } from '../../utils/timezoneUtils';
import {
  lastWishNextCheckInMs,
  lastWishRemainingMs,
  lastWishCountdownSnapshot,
  lastWishStatusChip,
} from '../../lib/lastWishCheckInCountdown';
import { DASHBOARD_WIDGET_DRAG_CLEAR_RIGHT } from '../../constants/dashboardWidget';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Settings, 
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CountdownData {
  daysLeft: number;
  nextCheckIn: string;
  isOverdue: boolean;
  urgencyLevel: 'safe' | 'warning' | 'critical' | 'overdue';
  progressPercentage: number;
  timeLeft?: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  isFinalDay?: boolean;
  isFinalHour?: boolean;
  remainingMs?: number;
}

interface DeliveryData {
  deliveredAt: string;
  recipients: Array<{
    email: string;
    status: string;
  }>;
  deliveryCount: number;
}

interface LastWishCountdownWidgetProps {
  isAccordionExpanded?: boolean;
  onAccordionToggle?: () => void;
}

export const LastWishCountdownWidget: React.FC<LastWishCountdownWidgetProps> = ({
  isAccordionExpanded = true,
  onAccordionToggle
}) => {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  
  // Check if user has Premium plan for Last Wish
  const isPremium = profile?.subscription?.plan === 'premium';
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [countdown, setCountdown] = useState<CountdownData | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [isDelivered, setIsDelivered] = useState(false);
  const [immediateCheckTriggered, setImmediateCheckTriggered] = useState(false);

  // Trigger immediate check for overdue users (backup to hourly cron)
  const triggerImmediateCheck = useCallback(async () => {
    if (!user || immediateCheckTriggered) return;
    
    try {
      // Call the API endpoint to check for overdue users
      const response = await fetch('/api/last-wish-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setImmediateCheckTriggered(true);
        // Silently trigger - no user notification needed
      }
    } catch (error) {
      // Silently fail - hourly cron will handle it
      console.error('Immediate Last Wish check failed:', error);
    }
  }, [user, immediateCheckTriggered]);

  useEffect(() => {
    if (!user) {
      setCountdown(null);
      setEnabled(false);
      return;
    }

    const fetchLastWish = async () => {
      const { data, error } = await supabase
        .from('last_wish_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data && data.is_enabled && data.check_in_frequency) {
        setEnabled(true);
        
        // Check for successful deliveries in last_wish_deliveries table
        const { data: deliveries, error: deliveryError } = await supabase
          .from('last_wish_deliveries')
          .select('*')
          .eq('user_id', user.id)
          .eq('delivery_status', 'sent')
          .order('sent_at', { ascending: false })
          .limit(1);
        
        // If delivery_triggered flag is explicitly true, mark as delivered
        // Otherwise, only check deliveries table if delivery_triggered is null/undefined (fallback for old records)
        // If delivery_triggered is false (after reactivation), don't mark as delivered even if deliveries exist
        const isDelivered = data.delivery_triggered === true || 
          (data.delivery_triggered === null && deliveries && deliveries.length > 0);
        
        if (isDelivered) {
          setIsDelivered(true);
          
          if (!deliveryError && deliveries && deliveries.length > 0) {
            setDeliveryData({
              deliveredAt: deliveries[0].sent_at,
              recipients: deliveries.map(d => ({
                email: d.recipient_email,
                status: d.delivery_status
              })),
              deliveryCount: deliveries.length
            });
          }
          return; // Don't process countdown if delivered
        } else {
          // Clear delivered state if not delivered
          setIsDelivered(false);
          setDeliveryData(null);
        }
        
        if (data.last_check_in) {
          const nextMs = lastWishNextCheckInMs(data.last_check_in, data.check_in_frequency);
          const remainingMs = lastWishRemainingMs(nextMs, Date.now());
          const snapshot = lastWishCountdownSnapshot(
            remainingMs,
            data.check_in_frequency,
            formatAppDate(new Date(nextMs))
          );
          setCountdown(snapshot);

          // Trigger immediate check if overdue and not already triggered
          if (snapshot.isOverdue && !immediateCheckTriggered) {
            setTimeout(() => {
              triggerImmediateCheck();
            }, 0);
          } else if (!snapshot.isOverdue) {
            setImmediateCheckTriggered(false);
          }
        } else {
          setCountdown({
            daysLeft: data.check_in_frequency,
            nextCheckIn: 'Not set yet',
            isOverdue: false,
            urgencyLevel: 'safe',
            progressPercentage: 0,
          });
        }
      } else {
        setCountdown(null);
        setEnabled(false);
      }
    };
    
    fetchLastWish();
  }, [user, triggerImmediateCheck, immediateCheckTriggered]);

  // Real-time countdown timer - updates every second when enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (enabled && countdown && user?.id) {
      interval = setInterval(() => {
        // Re-fetch to get updated time
        const fetchUpdatedTime = async () => {
          const { data, error } = await supabase
            .from('last_wish_settings')
            .select('last_check_in, check_in_frequency')
            .eq('user_id', user?.id)
            .single();
          
          if (!error && data && data.last_check_in) {
            const nextMs = lastWishNextCheckInMs(data.last_check_in, data.check_in_frequency);
            const remainingMs = lastWishRemainingMs(nextMs, Date.now());
            const snapshot = lastWishCountdownSnapshot(
              remainingMs,
              data.check_in_frequency,
              formatAppDate(new Date(nextMs))
            );

            setCountdown((prev) => (prev ? { ...prev, ...snapshot } : null));

            if (snapshot.isOverdue && !immediateCheckTriggered) {
              triggerImmediateCheck();
            }
          }
        };
        
        fetchUpdatedTime();
      }, 1000); // Update every second
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [enabled, user?.id, countdown?.daysLeft, immediateCheckTriggered, triggerImmediateCheck]); // Update when enabled state or user changes
  
  // Don't render for free users
  if (!isPremium) {
    return null;
  }

  const handleCheckIn = async () => {
    if (!user || checkingIn) return;
    
    setCheckingIn(true);
    try {
      const { error } = await supabase
        .from('last_wish_settings')
        .update({ last_check_in: new Date().toISOString() })
        .eq('user_id', user.id);
      
      if (error) {
        toast.error('Failed to check in. Please try again.');
      } else {
        setImmediateCheckTriggered(false); // Reset flag on successful check-in
        toast.success('Check-in successful! Your data is safe.');
        // Refresh the widget
        window.location.reload();
      }
    } catch (error) {
      toast.error('An error occurred during check-in.');
    } finally {
      setCheckingIn(false);
    }
  };

  const getUrgencyColors = (level: string) => {
    switch (level) {
      case 'overdue':
        return {
          bg: 'bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-red-900/40 dark:via-gray-900 dark:to-red-900/20',
          border: 'border-red-400 dark:border-red-600',
          text: 'text-red-900 dark:text-red-100',
          icon: 'text-red-500',
          progress: 'bg-red-500'
        };
      case 'critical':
        return {
          bg: 'bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-orange-900/40 dark:via-gray-900 dark:to-orange-900/20',
          border: 'border-orange-400 dark:border-orange-600',
          text: 'text-orange-900 dark:text-orange-100',
          icon: 'text-orange-500',
          progress: 'bg-orange-500'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-yellow-50 via-white to-yellow-100 dark:from-yellow-900/40 dark:via-gray-900 dark:to-yellow-900/20',
          border: 'border-yellow-400 dark:border-yellow-600',
          text: 'text-yellow-900 dark:text-yellow-100',
          icon: 'text-yellow-500',
          progress: 'bg-yellow-500'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-green-50 via-white to-green-100 dark:from-green-900/40 dark:via-gray-900 dark:to-green-900/20',
          border: 'border-green-400 dark:border-green-600',
          text: 'text-green-900 dark:text-green-100',
          icon: 'text-green-500',
          progress: 'bg-green-500'
        };
    }
  };

  const getUrgencyIcon = (level: string) => {
    const cls = 'w-4 h-4';
    switch (level) {
      case 'overdue':
        return <AlertTriangle className={`${cls} text-red-500 animate-pulse`} />;
      case 'critical':
        return <AlertTriangle className={`${cls} text-orange-500 animate-pulse`} />;
      case 'warning':
        return <Clock className={`${cls} text-yellow-500`} />;
      default:
        return <CheckCircle className={`${cls} text-green-500`} />;
    }
  };

  // If delivered, show delivery status
  if (isDelivered && deliveryData) {
    return (
      <div className="bg-gradient-to-br from-green-50 via-white to-blue-100 dark:from-green-900/40 dark:via-gray-900 dark:to-blue-900/20 rounded-xl p-3 border-2 border-green-400 dark:border-green-600">
        <div className="flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[1rem] text-green-900 dark:text-green-100 leading-tight">Last Wish Delivered</h3>
            <p className="text-[11px] text-green-700 dark:text-green-300 mt-0.5 truncate">
              {formatAppDate(deliveryData.deliveredAt)} · {deliveryData.deliveryCount} recipient{deliveryData.deliveryCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/last-wish')}
            className="flex-shrink-0 p-1.5 bg-green-600 text-white rounded-md hover:bg-green-700"
            title="Manage settings"
            aria-label="Manage settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // If not enabled, show a minimal setup prompt
  if (!enabled || !countdown) {
    return (
      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-xl p-3 border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[1rem] text-gray-900 dark:text-white leading-tight">Last Wish</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              Set up automatic data sharing
            </p>
          </div>
          <button
            onClick={() => navigate('/last-wish')}
            className="flex-shrink-0 px-2.5 py-1.5 bg-gradient-primary text-white rounded-md text-[0.8rem] font-medium"
          >
            Set Up
          </button>
        </div>
      </div>
    );
  }

  const colors = getUrgencyColors(countdown.urgencyLevel);
  const isAtRisk = countdown.urgencyLevel === 'critical' || countdown.urgencyLevel === 'overdue';
  const statusChip = lastWishStatusChip(countdown.remainingMs ?? 0, countdown.urgencyLevel);
  const urgentCta =
    countdown.isOverdue || countdown.isFinalDay || countdown.isFinalHour || countdown.urgencyLevel === 'critical';

  const countdownLabel = countdown.timeLeft
    ? `${String(countdown.timeLeft.hours).padStart(2, '0')}:${String(countdown.timeLeft.minutes).padStart(2, '0')}:${String(countdown.timeLeft.seconds).padStart(2, '0')}`
    : `${countdown.daysLeft}d`;
  const countdownHint = countdown.timeLeft
    ? 'Check in now to keep data safe'
    : 'Until next check-in';

  // Circular progress (visual anchor — keeps the card from feeling empty)
  const ringSize = 72;
  const ringStroke = 5;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - Math.min(100, Math.max(0, countdown.progressPercentage)) / 100);
  const ringStrokeClass = countdown.timeLeft
    ? 'stroke-red-500'
    : countdown.urgencyLevel === 'overdue'
      ? 'stroke-red-500'
      : countdown.urgencyLevel === 'critical'
        ? 'stroke-orange-500'
        : countdown.urgencyLevel === 'warning'
          ? 'stroke-yellow-500'
          : 'stroke-green-500';

  return (
    <div
      className={`${colors.bg} rounded-xl p-3.5 border-2 ${colors.border} shadow-sm animate-slide-in ${
        countdown.urgencyLevel === 'overdue' ? 'animate-pulse-urgent' : ''
      }`}
    >
      <div className={`flex items-center gap-1.5 min-w-0 mb-3 ${DASHBOARD_WIDGET_DRAG_CLEAR_RIGHT}`}>
        <div className="relative flex-shrink-0">
          {getUrgencyIcon(countdown.urgencyLevel)}
          {isAtRisk && (
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
        <h3 className={`font-bold text-[1rem] ${colors.text} truncate`}>Last Wish</h3>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold leading-none flex-shrink-0 ${statusChip.className}`}>
          {statusChip.label}
        </span>
        <button
          type="button"
          onClick={() => setDetailsExpanded((v) => !v)}
          className="ml-0.5 flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md border border-black/15 dark:border-white/20 bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
          title={detailsExpanded ? 'Show less' : 'Show more'}
          aria-expanded={detailsExpanded}
          aria-label={detailsExpanded ? 'Show less' : 'Show more'}
        >
          {detailsExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              strokeWidth={ringStroke}
              className="stroke-black/10 dark:stroke-white/10"
            />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={ringRadius}
              fill="none"
              strokeWidth={ringStroke}
              strokeLinecap="round"
              className={`${ringStrokeClass} transition-[stroke-dashoffset] duration-700`}
              style={{
                strokeDasharray: ringCircumference,
                strokeDashoffset: ringOffset,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold tabular-nums leading-none ${colors.text}`}>
              {Math.round(countdown.progressPercentage)}%
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-xl font-bold tabular-nums leading-none ${colors.text}`}>
            {countdownLabel}
          </p>
          <p className={`mt-1 text-sm font-semibold ${colors.text} leading-snug`}>{countdownHint}</p>
          {detailsExpanded && (
            <>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Next: {countdown.nextCheckIn}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                Stay active to protect shared data
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={handleCheckIn}
          disabled={checkingIn}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[0.8rem] font-semibold shadow-sm transition-all ${
            urgentCta
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {checkingIn ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5" />
          )}
          {checkingIn ? 'Checking In...' : 'Check In Now'}
        </button>
        <button
          onClick={() => navigate('/last-wish')}
          className="px-2.5 py-2 bg-gray-700/90 hover:bg-gray-800 text-white rounded-lg shadow-sm"
          title="Settings"
          aria-label="Last Wish settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}; 