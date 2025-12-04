import React from 'react';

export interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary';
    };
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    className = ""
}) => {
    const getActionClass = (variant: string = 'primary') => {
        switch (variant) {
            case 'secondary':
                return 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600';
            default:
                return 'bg-blue-600 text-white hover:bg-blue-700';
        }
    };

    return (
        <div className={`text-center py-8 ${className}`}>
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                {icon}
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 max-w-sm mx-auto">
                {description}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${getActionClass(action.variant)}`}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};
