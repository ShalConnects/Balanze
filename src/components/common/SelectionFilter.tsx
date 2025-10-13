import React from 'react';
import { X } from 'lucide-react';

interface SelectionFilterProps {
  label: string;
  value: string;
  onClear: () => void;
  className?: string;
}

export const SelectionFilter: React.FC<SelectionFilterProps> = ({
  label,
  value,
  onClear,
  className = ''
}) => {
  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 border border-blue-200 dark:border-blue-700 rounded-lg text-sm ${className}`}
      style={{ background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' }}
    >
      <span className="text-blue-700 dark:text-blue-300 font-medium">
        {label}: <span className="font-semibold">{value}</span>
      </span>
      <button
        onClick={onClear}
        className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors"
        title={`Clear ${label} filter`}
        aria-label={`Clear ${label} filter`}
      >
        <X className="w-3 h-3 text-blue-600 dark:text-blue-400" />
      </button>
    </div>
  );
};
