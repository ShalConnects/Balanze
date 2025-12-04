// Achievement Notification Component
// Shows achievement notifications when users earn new badges

import React, { useEffect, useState } from 'react';
import { AchievementNotification as AchievementNotificationType } from '../../types/achievement';
import { X, Trophy, TrendingUp } from 'lucide-react';

interface AchievementNotificationProps {
  notification: AchievementNotificationType;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  notification,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close if enabled
    if (autoClose) {
      const closeTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(closeTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [autoClose, duration, onClose]);

  useEffect(() => {
    if (notification.type === 'progress_update' && notification.progress) {
      // Animate progress bar
      const progressTimer = setTimeout(() => {
        setProgress(notification.progress || 0);
      }, 200);
      
      return () => clearTimeout(progressTimer);
    }
  }, [notification.progress]);

  const getNotificationIcon = () => {
    if (notification.type === 'new_achievement') {
      return <Trophy className="w-6 h-6 text-yellow-500" />;
    }
    return <TrendingUp className="w-6 h-6 text-blue-500" />;
  };

  const getNotificationColor = () => {
    if (notification.type === 'new_achievement') {
      return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    }
    return 'bg-gradient-to-r from-blue-400 to-purple-500';
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          ${getNotificationColor()}
          rounded-lg shadow-lg border border-white/20
          backdrop-blur-sm
        `}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              {getNotificationIcon()}
              <div>
                <h4 className="font-semibold text-white text-sm">
                  {notification.type === 'new_achievement' ? 'New Achievement!' : 'Progress Update'}
                </h4>
                <p className="text-white/90 text-xs">
                  {notification.achievement.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message */}
          <p className="text-white/90 text-sm mb-3">
            {notification.message}
          </p>

          {/* Progress bar for progress updates */}
          {notification.type === 'progress_update' && notification.progress && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span>Progress</span>
                <span>{Math.round(notification.progress)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white/60 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Achievement details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{notification.achievement.icon}</span>
              <div>
                <div className="text-xs text-white/80">
                  {notification.achievement.points} points
                </div>
                <div className="text-xs text-white/70 capitalize">
                  {notification.achievement.rarity}
                </div>
              </div>
            </div>
            
            {notification.type === 'new_achievement' && (
              <div className="text-right">
                <div className="text-xs text-white/80">Earned</div>
                <div className="text-xs text-white/70">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
