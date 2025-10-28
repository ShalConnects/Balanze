import React from 'react';
import { Trash2, Edit2, Info, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';

export interface MobileCardProps {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Array<{
    label: string;
    value: string;
    icon?: React.ReactNode;
  }>;
  actions?: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'primary';
  }>;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  id,
  title,
  subtitle,
  description,
  metadata = [],
  actions = [],
  isExpanded = false,
  onToggleExpanded,
  children,
  className = ""
}) => {
  const getActionClass = (variant: string = 'default') => {
    switch (variant) {
      case 'danger':
        return 'p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors';
      case 'primary':
        return 'p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors';
      default:
        return 'p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors';
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {onToggleExpanded && (
              <button
                onClick={onToggleExpanded}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
              {description}
            </p>
          )}

          {/* Metadata */}
          {metadata.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {metadata.map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  {item.icon && (
                    <span className="text-xs">{item.icon}</span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.label}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Expanded Content */}
          {isExpanded && children && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              {children}
            </div>
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={getActionClass(action.variant)}
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export interface MobileCardViewProps {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    metadata?: Array<{
      label: string;
      value: string;
      icon?: React.ReactNode;
    }>;
    actions?: Array<{
      icon: React.ReactNode;
      label: string;
      onClick: () => void;
      variant?: 'default' | 'danger' | 'primary';
    }>;
    isExpanded?: boolean;
    onToggleExpanded?: () => void;
    children?: React.ReactNode;
  }>;
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    description: string;
  };
  className?: string;
}

export const MobileCardView: React.FC<MobileCardViewProps> = ({
  items,
  emptyState,
  className = ""
}) => {
  if (items.length === 0 && emptyState) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
          {emptyState.icon}
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {emptyState.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {emptyState.description}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 p-3 ${className}`}>
      {items.map((item) => (
        <MobileCard
          key={item.id}
          id={item.id}
          title={item.title}
          subtitle={item.subtitle}
          description={item.description}
          metadata={item.metadata}
          actions={item.actions}
          isExpanded={item.isExpanded}
          onToggleExpanded={item.onToggleExpanded}
        >
          {item.children}
        </MobileCard>
      ))}
    </div>
  );
};
