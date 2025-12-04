import React from 'react';
import { Eye, LucideIcon } from 'lucide-react';

interface ShowOnDashboardBannerProps {
  isVisible: boolean;
  onShow: () => void;
  title: string;
  description: string;
  buttonText?: string;
  icon?: LucideIcon;
  className?: string;
}

export const ShowOnDashboardBanner: React.FC<ShowOnDashboardBannerProps> = ({
  isVisible,
  onShow,
  title,
  description,
  buttonText = "Show on Dashboard",
  icon: Icon = Eye,
  className = ""
}) => {
  if (!isVisible) return null;

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700 mb-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center">
              <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 leading-tight">
              {title}
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-xs leading-tight">
              {description}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={onShow}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title={`${buttonText}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{buttonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

