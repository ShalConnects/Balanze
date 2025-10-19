import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface EnhancedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  variant?: 'light' | 'dark';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  offset?: number;
  maxWidth?: number;
  showArrow?: boolean;
}

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({ 
  content, 
  children, 
  variant = 'dark',
  position = 'auto',
  offset = 8,
  maxWidth = 300,
  showArrow = true
}) => {
  const [visible, setVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, arrowPosition: 'top', arrowOffset: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let finalPosition = position;
    let top = 0;
    let left = 0;
    let arrowPos = 'top';
    let arrowOffset = 0;

    // Auto positioning logic
    if (position === 'auto') {
      const spaceAbove = triggerRect.top;
      const spaceBelow = viewport.height - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = viewport.width - triggerRect.right;

      if (spaceBelow >= tooltipRect.height + offset) {
        finalPosition = 'bottom';
      } else if (spaceAbove >= tooltipRect.height + offset) {
        finalPosition = 'top';
      } else if (spaceRight >= tooltipRect.width + offset) {
        finalPosition = 'right';
      } else if (spaceLeft >= tooltipRect.width + offset) {
        finalPosition = 'left';
      } else {
        // Fallback to bottom with adjustments
        finalPosition = 'bottom';
      }
    }

    // Calculate position based on final position
    switch (finalPosition) {
      case 'top':
        top = triggerRect.top + window.scrollY - tooltipRect.height - offset;
        left = triggerRect.left + window.scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        arrowPos = 'bottom';
        // Calculate arrow offset to point at the center of the trigger
        arrowOffset = Math.min(Math.max(triggerRect.left + (triggerRect.width / 2) - (left + tooltipRect.width / 2), -tooltipRect.width / 2 + 12), tooltipRect.width / 2 - 12);
        break;
      case 'bottom':
        top = triggerRect.bottom + window.scrollY + offset;
        left = triggerRect.left + window.scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        arrowPos = 'top';
        // Calculate arrow offset to point at the center of the trigger
        arrowOffset = Math.min(Math.max(triggerRect.left + (triggerRect.width / 2) - (left + tooltipRect.width / 2), -tooltipRect.width / 2 + 12), tooltipRect.width / 2 - 12);
        break;
      case 'left':
        top = triggerRect.top + window.scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left + window.scrollX - tooltipRect.width - offset;
        arrowPos = 'right';
        // Calculate arrow offset to point at the center of the trigger
        arrowOffset = Math.min(Math.max(triggerRect.top + (triggerRect.height / 2) - (top + tooltipRect.height / 2), -tooltipRect.height / 2 + 12), tooltipRect.height / 2 - 12);
        break;
      case 'right':
        top = triggerRect.top + window.scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + window.scrollX + offset;
        arrowPos = 'left';
        // Calculate arrow offset to point at the center of the trigger
        arrowOffset = Math.min(Math.max(triggerRect.top + (triggerRect.height / 2) - (top + tooltipRect.height / 2), -tooltipRect.height / 2 + 12), tooltipRect.height / 2 - 12);
        break;
    }

    // Ensure tooltip stays within viewport
    const adjustedLeft = Math.max(8, Math.min(left, viewport.width - tooltipRect.width - 8));
    const adjustedTop = Math.max(8, Math.min(top, viewport.height - tooltipRect.height - 8));

    setTooltipPosition({
      top: adjustedTop,
      left: adjustedLeft,
      arrowPosition: arrowPos,
      arrowOffset: arrowOffset
    });
  };

  const showTooltip = () => {
    setVisible(true);
    // Use setTimeout to ensure tooltip is rendered before calculating position
    setTimeout(calculatePosition, 0);
  };

  const hideTooltip = () => setVisible(false);

  // Recalculate position on scroll and resize
  useEffect(() => {
    if (visible) {
      const handleScroll = () => calculatePosition();
      const handleResize = () => calculatePosition();

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [visible]);

  const getArrowClasses = () => {
    const baseClasses = "absolute w-2 h-2 transform rotate-45";
    const variantClasses = variant === 'dark' 
      ? "bg-gray-800 dark:bg-gray-700" 
      : "bg-white border border-gray-200";

    const arrowOffset = tooltipPosition.arrowOffset || 0;

    switch (tooltipPosition.arrowPosition) {
      case 'top':
        return `${baseClasses} ${variantClasses} -top-1`;
      case 'bottom':
        return `${baseClasses} ${variantClasses} -bottom-1`;
      case 'left':
        return `${baseClasses} ${variantClasses} -left-1`;
      case 'right':
        return `${baseClasses} ${variantClasses} -right-1`;
      default:
        return `${baseClasses} ${variantClasses} -top-1`;
    }
  };

  const getArrowStyle = () => {
    const arrowOffset = tooltipPosition.arrowOffset || 0;
    
    switch (tooltipPosition.arrowPosition) {
      case 'top':
      case 'bottom':
        return {
          left: `calc(50% + ${arrowOffset}px)`,
          transform: 'translateX(-50%)'
        };
      case 'left':
      case 'right':
        return {
          top: `calc(50% + ${arrowOffset}px)`,
          transform: 'translateY(-50%)'
        };
      default:
        return {
          left: '50%',
          transform: 'translateX(-50%)'
        };
    }
  };

  const getTooltipClasses = () => {
    const baseClasses = "z-[9999] pointer-events-none px-3 py-2 rounded shadow-lg text-xs max-w-sm";
    const variantClasses = variant === 'dark'
      ? "bg-gray-800 dark:bg-gray-700 text-white border border-gray-700"
      : "bg-white border border-gray-200 text-gray-700";

    return `${baseClasses} ${variantClasses}`;
  };

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        className="relative inline-flex items-center cursor-pointer"
        onMouseEnter={showTooltip}
        onFocus={showTooltip}
        onMouseLeave={hideTooltip}
        onBlur={hideTooltip}
        aria-describedby="enhanced-tooltip"
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            id="enhanced-tooltip"
            className={getTooltipClasses()}
            style={{
              position: 'absolute',
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              minWidth: 200,
              maxWidth: maxWidth,
              whiteSpace: 'normal',
            }}
            role="tooltip"
          >
            {content}
            {showArrow && (
              <div 
                className={getArrowClasses()} 
                style={getArrowStyle()}
              />
            )}
          </div>,
          document.body
        )}
    </>
  );
};
