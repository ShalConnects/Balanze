import React, { ReactNode } from 'react';

interface WidgetSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export const WidgetSection: React.FC<WidgetSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header - only show if title or description provided */}
      {(title || description) && (
        <div className="pb-2 border-b border-gray-200 dark:border-gray-700">
          {title && (
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      
      {/* Section Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

