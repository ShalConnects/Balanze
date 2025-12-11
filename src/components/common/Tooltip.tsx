// Tooltip Component
// Simple tooltip component for achievement badges

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const triggerRef = useRef<HTMLSpanElement>(null);
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
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spacing = 8;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        // Position tooltip centered above the trigger, using scroll offsets like EnhancedTooltip
        top = triggerRect.top + window.scrollY - tooltipRect.height - spacing;
        left = triggerRect.left + window.scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        // If would go off top, show below instead
        if (top < window.scrollY + spacing) {
          top = triggerRect.bottom + window.scrollY + spacing;
        }
        break;
      case 'bottom':
        top = triggerRect.bottom + window.scrollY + spacing;
        left = triggerRect.left + window.scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        if (top + tooltipRect.height > window.scrollY + viewportHeight - spacing) {
          top = triggerRect.top + window.scrollY - tooltipRect.height - spacing;
        }
        break;
      case 'left':
        top = triggerRect.top + window.scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left + window.scrollX - tooltipRect.width - spacing;
        if (left < window.scrollX + spacing) {
          left = triggerRect.right + window.scrollX + spacing;
        }
        break;
      case 'right':
        top = triggerRect.top + window.scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + window.scrollX + spacing;
        if (left + tooltipRect.width > window.scrollX + viewportWidth - spacing) {
          left = triggerRect.left + window.scrollX - tooltipRect.width - spacing;
        }
        break;
    }

    // Clamp to viewport (with scroll offsets)
    left = Math.max(window.scrollX + spacing, Math.min(left, window.scrollX + viewportWidth - tooltipRect.width - spacing));
    top = Math.max(window.scrollY + spacing, Math.min(top, window.scrollY + viewportHeight - tooltipRect.height - spacing));

    setPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      // Use setTimeout like EnhancedTooltip to ensure tooltip is rendered before calculating position
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
    <>
      <span
        ref={triggerRef}
        className="relative inline-flex items-center"
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
      >
        {children}
      </span>
      
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`
              absolute z-[9999] px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg
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
          </div>,
          document.body
        )}
    </>
  );
};