// Tooltip Component
// Simple tooltip component for achievement badges

import React, { useState, useRef, useEffect } from 'react';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 200,
  className = ''
}) => {
  const { isMobile } = useMobileDetection();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (isMobile) {
      // On mobile, show immediately on click/tap
      setIsVisible(true);
    } else {
      // On desktop, use delay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      setIsVisible(prev => !prev);
    }
  };

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spacing = 8;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top + scrollTop - tooltipRect.height - spacing;
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
        // Adjust if tooltip would go off-screen at the top
        if (top < scrollTop + spacing) {
          top = triggerRect.bottom + scrollTop + spacing; // Show below instead
        }
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollTop + spacing;
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
        // Adjust if tooltip would go off-screen at the bottom
        if (top + tooltipRect.height > scrollTop + viewportHeight - spacing) {
          top = triggerRect.top + scrollTop - tooltipRect.height - spacing; // Show above instead
        }
        break;
      case 'left':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollLeft - tooltipRect.width - spacing;
        // Adjust if tooltip would go off-screen to the left
        if (left < scrollLeft + spacing) {
          left = triggerRect.right + scrollLeft + spacing; // Show to the right instead
        }
        break;
      case 'right':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollLeft + spacing;
        // Adjust if tooltip would go off-screen to the right
        if (left + tooltipRect.width > scrollLeft + viewportWidth - spacing) {
          left = triggerRect.left + scrollLeft - tooltipRect.width - spacing; // Show to the left instead
        }
        break;
    }

    // Ensure tooltip doesn't go off-screen horizontally
    if (left < scrollLeft + spacing) {
      left = scrollLeft + spacing;
    }
    if (left + tooltipRect.width > scrollLeft + viewportWidth - spacing) {
      left = scrollLeft + viewportWidth - tooltipRect.width - spacing;
    }

    // Ensure tooltip doesn't go off-screen vertically
    if (top < scrollTop + spacing) {
      top = scrollTop + spacing;
    }
    if (top + tooltipRect.height > scrollTop + viewportHeight - spacing) {
      top = scrollTop + viewportHeight - tooltipRect.height - spacing;
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure tooltip is rendered before calculating position
      const timeoutId = setTimeout(() => {
        updatePosition();
      }, 0);

      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      // Close tooltip on outside click for mobile
      const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        if (isMobile && tooltipRef.current && triggerRef.current) {
          const target = e.target as Node;
          if (!tooltipRef.current.contains(target) && !triggerRef.current.contains(target)) {
            setIsVisible(false);
          }
        }
      };
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      if (isMobile) {
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
        if (isMobile) {
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('touchstart', handleClickOutside);
        }
      };
    }
  }, [isVisible, placement, isMobile]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getArrowClasses = () => {
    switch (placement) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900';
      default:
        return '';
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={() => {
          if (!isMobile) {
            showTooltip();
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) {
            hideTooltip();
          }
        }}
        onClick={handleClick}
        onFocus={() => {
          if (!isMobile) {
            showTooltip();
          }
        }}
        onBlur={() => {
          if (!isMobile) {
            hideTooltip();
          }
        }}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg
            max-w-xs break-words
            ${isMobile ? 'touch-manipulation' : ''}
            ${className}
          `}
          style={{
            top: position.top,
            left: position.left,
          }}
          onClick={(e) => {
            if (isMobile) {
              e.stopPropagation();
            }
          }}
        >
          {content}
          <div
            className={`
              absolute w-0 h-0 border-4
              ${getArrowClasses()}
            `}
          />
        </div>
      )}
    </div>
  );
};