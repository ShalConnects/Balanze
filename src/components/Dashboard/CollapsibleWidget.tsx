import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleWidgetProps {
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  storageKey?: string; // Optional key for localStorage persistence
}

export const CollapsibleWidget: React.FC<CollapsibleWidgetProps> = ({
  children,
  defaultExpanded = false,
  className = '',
  storageKey,
}) => {
  // Load initial state from localStorage if storageKey is provided
  const getInitialState = (): boolean => {
    if (storageKey) {
      const saved = localStorage.getItem(`widget-collapsed-${storageKey}`);
      if (saved !== null) {
        return saved === 'false'; // 'false' means expanded
      }
    }
    return defaultExpanded;
  };

  const [isExpanded, setIsExpanded] = useState(getInitialState);
  const contentRef = useRef<HTMLDivElement>(null);

  // Persist state to localStorage when it changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`widget-collapsed-${storageKey}`, String(!isExpanded));
    }
  }, [isExpanded, storageKey]);

  // Handle null children (when widget returns null)
  if (!children) {
    return null;
  }

  return (
    <div className={`relative min-h-[40px] ${className}`}>
      {/* Collapse button - always visible, positioned absolutely */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-md transition-all duration-200 hover:shadow-lg ${
          !isExpanded ? 'shadow-lg ring-2 ring-blue-200 dark:ring-blue-800' : ''
        }`}
        title={isExpanded ? 'Collapse widget' : 'Expand widget'}
        aria-label={isExpanded ? 'Collapse widget' : 'Expand widget'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>
      
      {/* Widget content */}
      <div
        ref={contentRef}
        className={`transition-all duration-300 ease-in-out ${
          isExpanded 
            ? 'max-h-[5000px] opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}
        aria-hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
};

