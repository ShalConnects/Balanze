import React, { useCallback, useEffect, useRef, useState } from 'react';

interface PullToRefreshDashboardProps {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

const DEFAULT_THRESHOLD = 80;
const MAX_PULL_DISTANCE = 120;
const ANIMATION_DURATION = 300;
const SUCCESS_DISPLAY_DURATION = 800;

export const PullToRefreshDashboard: React.FC<PullToRefreshDashboardProps> = ({
  onRefresh,
  threshold = DEFAULT_THRESHOLD,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const startYRef = useRef(0);
  const refreshingRef = useRef(false);

  const PULL_THRESHOLD = threshold;

  const handleRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setIsRefreshing(true);
    try {
      await onRefresh();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), SUCCESS_DISPLAY_DURATION);
    } finally {
      setIsRefreshing(false);
      refreshingRef.current = false;
      setPullDistance(0);
    }
  }, [onRefresh]);

  useEffect(() => {
    let mounted = true;
    const root = document.getElementById('root');
    if (!root) return;

    const onTouchStart = (e: TouchEvent) => {
      if (!mounted || isRefreshing || refreshingRef.current) return;
      if (root.scrollTop !== 0) return;
      if (e.touches.length === 0) return;
      startYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!mounted || isRefreshing || refreshingRef.current) return;
      if (root.scrollTop !== 0) {
        setPullDistance(0);
        return;
      }
      if (e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startYRef.current);
      if (distance <= 0) return;
      setPullDistance(Math.min(distance, MAX_PULL_DISTANCE));
    };

    const onTouchEnd = async () => {
      if (!mounted) return;
      if (pullDistance >= PULL_THRESHOLD && !isRefreshing && !refreshingRef.current) {
        await handleRefresh();
      } else {
        setPullDistance(0);
      }
    };

    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: true });
    root.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      mounted = false;
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleRefresh, isRefreshing, PULL_THRESHOLD, pullDistance]);

  if (pullDistance === 0 && !isRefreshing && !showSuccess) return null;

  const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const rotation = (pullDistance / PULL_THRESHOLD) * 360;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance, 60)}px)`,
        opacity,
        transition: isRefreshing || showSuccess ? `all ${ANIMATION_DURATION}ms ease` : 'none',
      }}
    >
      <div
        className={
          `rounded-full p-3 shadow-lg bg-white dark:bg-gray-800 transition-all duration-200 ` +
          `${pullDistance >= PULL_THRESHOLD ? 'scale-110 ring-2 ring-blue-500' : ''} ` +
          `${showSuccess ? 'scale-110 ring-2 ring-green-500' : ''}`
        }
      >
        {/* Simple spinner */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className={`${isRefreshing ? 'animate-spin' : ''}`}
          style={{ transform: isRefreshing ? 'none' : `rotate(${rotation}deg)` }}
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.2" />
          <path d="M12 2 a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </div>
      {isRefreshing && (
        <span className="absolute top-16 text-sm font-medium text-blue-600 dark:text-blue-400">Refreshing...</span>
      )}
      {showSuccess && (
        <span className="absolute top-16 text-sm font-medium text-green-600 dark:text-green-400">Refreshed!</span>
      )}
    </div>
  );
};

export default PullToRefreshDashboard;


