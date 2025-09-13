import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Settings, 
  Eye, 
  Calendar,
  Users,
  FileText,
  ArrowRight,
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
}

export const LastWishCountdownWidget: React.FC = () => {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  
  // Check if user has Premium plan for Last Wish
  const isPremium = profile?.subscription?.plan === 'premium';
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [countdown, setCountdown] = useState<CountdownData | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<{
    isDelivered: boolean;
    deliveredAt: string | null;
    recipients: string[];
  }>({
    isDelivered: false,
    deliveredAt: null,
    recipients: []
  });

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
        
        if (data.last_check_in) {
          const lastCheckIn = new Date(data.last_check_in);
          const now = new Date();
          
          // Normal mode: calculate days
          const nextCheckIn = new Date(lastCheckIn.getTime() + data.check_in_frequency * 24 * 60 * 60 * 1000);
          const daysLeft = Math.ceil((nextCheckIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysLeft < 0;
          
          // Calculate urgency level
          let urgencyLevel: 'safe' | 'warning' | 'critical' | 'overdue' = 'safe';
          if (isOverdue) {
            urgencyLevel = 'overdue';
          } else if (daysLeft <= 3) {
            urgencyLevel = 'critical';
          } else if (daysLeft <= 7) {
            urgencyLevel = 'warning';
          }
          
          // Calculate progress percentage (0-100)
          const totalDays = data.check_in_frequency;
          const daysElapsed = totalDays - daysLeft;
          const progressPercentage = Math.max(0, Math.min(100, (daysElapsed / totalDays) * 100));
          
          setCountdown({
            daysLeft: Math.max(0, daysLeft),
            nextCheckIn: nextCheckIn.toLocaleDateString(),
            isOverdue,
            urgencyLevel,
            progressPercentage
          });
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
  }, [user]);

  
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
    switch (level) {
      case 'overdue':
        return <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />;
      case 'critical':
        return <AlertTriangle className="w-6 h-6 text-orange-500 animate-pulse" />;
      case 'warning':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      default:
        return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
  };

  const getUrgencyMessage = (level: string, daysLeft: number) => {
    switch (level) {
      case 'overdue':
        return `OVERDUE! Check in immediately`;
      case 'critical':
        return `${daysLeft} days left - Check in soon!`;
      case 'warning':
        return `${daysLeft} days left`;
      default:
        return `${daysLeft} days left - All good!`;
    }
  };

  // If not enabled, show a minimal setup prompt
  if (!enabled || !countdown) {
    return (
      <div className="mb-5 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl p-5 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-gray-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Last Wish</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Set up automatic data sharing for your loved ones
            </p>
            <button
              onClick={() => navigate('/settings?tab=last-wish')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              Set Up Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const colors = getUrgencyColors(countdown.urgencyLevel);

      return (
      <div className={`mb-5 ${colors.bg} rounded-2xl shadow-xl p-5 border-2 ${colors.border} transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] animate-slide-in ${
        countdown.urgencyLevel === 'overdue' ? 'animate-pulse-urgent' : ''
      }`}>
             {/* Header */}
       <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-3">
           <div className="relative">
             {getUrgencyIcon(countdown.urgencyLevel)}
             {(countdown.urgencyLevel === 'critical' || countdown.urgencyLevel === 'overdue') && (
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
             )}
           </div>
           <div>
             <h3 className={`font-bold text-lg ${colors.text}`}>
               Last Wish Check-in
             </h3>
             <p className={`text-sm ${colors.text} opacity-80`}>
               {getUrgencyMessage(countdown.urgencyLevel, countdown.daysLeft)}
             </p>
           </div>
         </div>
         <div className="flex items-center gap-2">
           {(countdown.urgencyLevel === 'critical' || countdown.urgencyLevel === 'overdue') && (
             <div className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-full animate-pulse">
               URGENT
             </div>
           )}
           <button
             onClick={() => setShowDetails(!showDetails)}
             className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors duration-200"
           >
             <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
           </button>
         </div>
       </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(countdown.progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${colors.progress} progress-animate`}
            style={{ 
              width: `${countdown.progressPercentage}%`,
              '--progress-width': `${countdown.progressPercentage}%`
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleCheckIn}
          disabled={checkingIn}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            countdown.isOverdue 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {checkingIn ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          {checkingIn ? 'Checking In...' : 'Check In Now'}
        </button>
        <button
          onClick={() => navigate('/settings?tab=last-wish')}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Delivery Status */}
      {deliveryStatus.isDelivered && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              ✅ Last Wish Delivered!
            </span>
          </div>
          <div className="mt-1 text-xs text-green-700 dark:text-green-300">
            <p>Delivered to: {deliveryStatus.recipients.join(', ')}</p>
            <p>Time: {deliveryStatus.deliveredAt ? new Date(deliveryStatus.deliveredAt).toLocaleString() : 'Unknown'}</p>
          </div>
        </div>
      )}

      {/* Details Section */}
      {showDetails && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Next Check-in:</span>
            </div>
            <div className="text-right font-medium text-gray-900 dark:text-white">
              {countdown.nextCheckIn}
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Recipients:</span>
            </div>
            <div className="text-right">
              <button
                onClick={() => navigate('/settings?tab=last-wish')}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                Manage
              </button>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigate('/settings?tab=last-wish')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              <ArrowRight className="w-4 h-4" />
              View Full Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 