import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface AIChatButtonProps {
  onClick: () => void;
  className?: string;
  showBadge?: boolean;
}

/**
 * Standalone AI Chat Button component for integration into headers, sidebars, etc.
 */
export const AIChatButton: React.FC<AIChatButtonProps> = ({ 
  onClick, 
  className = '',
  showBadge = false 
}) => {
  const { isMobile } = useMobileDetection();

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      aria-label="Open AI chat"
    >
      <MessageCircle className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
      {!isMobile && <span className="text-sm font-medium">Balanzo</span>}
      {showBadge && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      )}
    </button>
  );
};

