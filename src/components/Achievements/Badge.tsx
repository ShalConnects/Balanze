// Badge Component
// Displays individual achievement badges with enhanced SVG icons and brand gradients

import React, { memo } from 'react';
import { BadgeProps } from '../../types/achievement';
import { Tooltip } from '../common/Tooltip';

// Enhanced SVG Icons with Brand Gradients
const AchievementIcons: Record<string, React.ReactNode> = {
  '🏦': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="bankGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M3 21h18v-2H3v2zm2-4h14v-2H5v2zm2-4h10v-2H7v2zm2-4h6V7H9v2z"
        fill="url(#bankGradient)"
      />
    </svg>
  ),
  '💰': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="moneyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        fill="url(#moneyGradient)"
      />
    </svg>
  ),
  '📁': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="folderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"
        fill="url(#folderGradient)"
      />
    </svg>
  ),
  '🎯': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="targetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#targetGradient)" opacity="0.2" />
      <circle cx="12" cy="12" r="6" fill="url(#targetGradient)" opacity="0.4" />
      <circle cx="12" cy="12" r="2" fill="url(#targetGradient)" />
    </svg>
  ),
  '📊': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M3 13h2v6H3v-6zm4-6h2v12H7V7zm4-4h2v16h-2V3zm4 8h2v8h-2v-8z"
        fill="url(#chartGradient)"
      />
    </svg>
  ),
  '💳': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="2" y="6" width="20" height="12" rx="2" fill="url(#cardGradient)" />
      <rect x="2" y="10" width="20" height="2" fill="white" opacity="0.3" />
    </svg>
  ),
  '🌍': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#globeGradient)" opacity="0.2" />
      <path
        d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
        stroke="url(#globeGradient)"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  ),
  '🤝': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="handshakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l2.414-2.414A1 1 0 0 1 11 12.586V14a1 1 0 0 0 1 1h2.586l4 4V8z"
        fill="url(#handshakeGradient)"
      />
    </svg>
  ),
  '📝': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="documentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        fill="url(#documentGradient)"
      />
      <path d="M14 2v6h6" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  ),
  '❤️': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="url(#heartGradient)"
      />
    </svg>
  ),
  '📈': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M3 13h2v6H3v-6zm4-6h2v12H7V7zm4-4h2v16h-2V3zm4 8h2v8h-2v-8z"
        fill="url(#trendGradient)"
      />
    </svg>
  ),
  '🔍': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="11" cy="11" r="8" stroke="url(#searchGradient)" strokeWidth="2" fill="none" />
      <path d="m21 21-4.35-4.35" stroke="url(#searchGradient)" strokeWidth="2" />
    </svg>
  ),
  '👑': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M5 16L3 5l5.5 5L12 4l3.5 6L20 5l-2 11H5z"
        fill="url(#crownGradient)"
      />
    </svg>
  ),
  '📜': (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <defs>
        <linearGradient id="scrollGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        fill="url(#scrollGradient)"
      />
      <path d="M14 2v6h6" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  )
};

const BadgeComponent: React.FC<BadgeProps> = ({
  achievement,
  earned = false,
  progress = 0,
  size = 'md',
  showTooltip = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  // Get the enhanced icon or fallback to emoji
  const getIcon = () => {
    const enhancedIcon = AchievementIcons[achievement.icon];
    if (enhancedIcon) {
      return enhancedIcon;
    }
    // Fallback to emoji for icons not in our enhanced set
    return <span className="text-2xl">{achievement.icon}</span>;
  };

  const badgeContent = (
    <div
      className={`
        ${sizeClasses[size]}
        ${earned ? 'opacity-100' : 'opacity-50'}
        ${earned ? 'shadow-lg' : 'shadow-sm'}
        rounded-full flex items-center justify-center
        transition-all duration-300 hover:scale-110
        ${className}
      `}
      style={{
        background: earned 
          ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
          : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)'
      }}
    >
      <div className={`${iconSizeClasses[size]} text-white`}>
        {getIcon()}
      </div>
      
      {/* Progress ring for unearned badges */}
      {!earned && progress > 0 && (
        <div className="absolute inset-0 rounded-full">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-300"
              strokeWidth="2"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-blue-500"
              strokeWidth="2"
              strokeDasharray={`${progress}, 100`}
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
        </div>
      )}
      
      {/* Earned indicator */}
      {earned && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </div>
  );

  if (showTooltip) {
    return (
      <Tooltip
        content={
          <div className="text-center">
            <div className="font-semibold text-white mb-1">
              {achievement.name}
            </div>
            <div className="text-sm text-gray-200 mb-2">
              {achievement.description}
            </div>
            <div className="text-xs text-gray-300">
              {earned ? '✅ Earned' : `📈 ${Math.round(progress)}% complete`}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {achievement.points} points • {achievement.rarity.toUpperCase()}
            </div>
          </div>
        }
        placement="top"
      >
        {badgeContent}
      </Tooltip>
    );
  }

  return badgeContent;
};

// Memoize the Badge component to prevent unnecessary re-renders
export const Badge = memo(BadgeComponent);
