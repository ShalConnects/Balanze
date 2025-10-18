import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  hapticFeedback?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ 
  onRefresh, 
  disabled = false, 
  threshold = 80, 
  hapticFeedback = true 
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const PULL_THRESHOLD = threshold; // Distance needed to trigger refresh

  // Haptic feedback function
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    
    navigator.vibrate(patterns[type]);
  }, [hapticFeedback]);

  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (disabled) return;
      
      const isAtTop = rootElement.scrollTop === 0;
      if (isAtTop && !isRefreshing) {
        setStartY(e.touches[0].clientY);
        triggerHapticFeedback('light');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (disabled) return;
      
      const isAtTop = rootElement.scrollTop === 0;
      if (!isAtTop || isRefreshing) {
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);
      
      if (distance > 0) {
        const newDistance = Math.min(distance, PULL_THRESHOLD * 1.5);
        setPullDistance(newDistance);
        
        // Haptic feedback when reaching threshold
        if (newDistance >= PULL_THRESHOLD && pullDistance < PULL_THRESHOLD) {
          triggerHapticFeedback('medium');
        }
      }
    };

    const handleTouchEnd = async () => {
      if (disabled) return;
      
      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        triggerHapticFeedback('heavy');
        
        try {
          await onRefresh();
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 1000);
        } catch (error) {
          console.error('Pull to refresh error:', error);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    rootElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    rootElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    rootElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      rootElement.removeEventListener('touchstart', handleTouchStart);
      rootElement.removeEventListener('touchmove', handleTouchMove);
      rootElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, startY, onRefresh]);

  const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const rotation = (pullDistance / PULL_THRESHOLD) * 360;
  const shouldTrigger = pullDistance >= PULL_THRESHOLD;
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  if (disabled) return null;
  if (pullDistance === 0 && !isRefreshing && !showSuccess) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 flex justify-center items-center z-50 pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance, 60)}px)`,
        opacity: opacity,
        transition: isRefreshing || showSuccess ? 'all 0.3s ease' : 'none',
      }}
    >
      <div
        className={`
          bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg transition-all duration-200
          ${shouldTrigger ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-110' : ''}
          ${showSuccess ? 'bg-gradient-to-r from-green-500 to-emerald-600 scale-110' : ''}
        `}
      >
        {showSuccess ? (
          <CheckCircle
            size={24}
            className="text-white animate-pulse"
          />
        ) : (
          <RefreshCw
            size={24}
            className={`
              ${shouldTrigger ? 'text-white' : 'text-blue-500 dark:text-blue-400'}
              ${isRefreshing ? 'animate-spin' : ''}
            `}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
            }}
          />
        )}
      </div>
      
      {/* Progress ring */}
      {pullDistance > 0 && !isRefreshing && !showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-gray-600">
            <div 
              className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent transition-all duration-200"
              style={{
                transform: `rotate(${progress * 360}deg)`,
              }}
            />
          </div>
        </div>
      )}
      
      {/* Status text */}
      {shouldTrigger && !isRefreshing && !showSuccess && (
        <span className="absolute top-16 text-sm font-medium text-gray-700 dark:text-gray-300 animate-pulse">
          Release to refresh
        </span>
      )}
      
      {isRefreshing && (
        <span className="absolute top-16 text-sm font-medium text-blue-600 dark:text-blue-400">
          Refreshing...
        </span>
      )}
      
      {showSuccess && (
        <span className="absolute top-16 text-sm font-medium text-green-600 dark:text-green-400 animate-pulse">
          Refreshed!
        </span>
      )}
    </div>
  );
};

export default PullToRefresh;

