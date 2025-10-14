import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const PULL_THRESHOLD = 80; // Distance needed to trigger refresh

  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;

    const handleTouchStart = (e: TouchEvent) => {
      const isAtTop = rootElement.scrollTop === 0;
      if (isAtTop && !isRefreshing) {
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const isAtTop = rootElement.scrollTop === 0;
      if (!isAtTop || isRefreshing) {
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);
      
      if (distance > 0) {
        setPullDistance(Math.min(distance, PULL_THRESHOLD * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
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

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 flex justify-center items-center z-50 pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance, 60)}px)`,
        opacity: opacity,
        transition: isRefreshing ? 'all 0.3s ease' : 'none',
      }}
    >
      <div
        className={`
          bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg
          ${shouldTrigger ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}
        `}
      >
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
      </div>
      {shouldTrigger && !isRefreshing && (
        <span className="absolute top-16 text-sm font-medium text-gray-700 dark:text-gray-300">
          Release to refresh
        </span>
      )}
    </div>
  );
};

export default PullToRefresh;

