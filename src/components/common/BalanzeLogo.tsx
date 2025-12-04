import React from 'react';

interface BalanzeLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BalanzeLogo: React.FC<BalanzeLogoProps> = ({ 
  variant = 'full', 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  if (variant === 'icon') {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-white font-bold text-lg">B</span>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <span className={`font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${textSizeClasses[size]} ${className}`}>
        Balanze
      </span>
    );
  }

  // Full logo (icon + text)
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center`}>
        <span className="text-white font-bold text-lg">B</span>
      </div>
      <span className={`font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${textSizeClasses[size]}`}>
        Balanze
      </span>
    </div>
  );
}; 

