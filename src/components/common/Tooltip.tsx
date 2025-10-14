import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const Tooltip: React.FC<{ content: React.ReactNode; children: React.ReactNode }> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // Position tooltip near the trigger
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const showTooltip = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6, // 6px below
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
    setVisible(true);
  };

  const hideTooltip = () => setVisible(false);

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
        aria-describedby="tooltip"
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            id="tooltip"
            className="z-[9999] pointer-events-none px-3 py-2 rounded shadow-lg text-xs bg-white border border-gray-200 text-gray-700"
            style={{
              position: 'absolute',
              top: coords.top,
              left: coords.left,
              transform: 'translateX(-50%)',
              minWidth: 220,
              maxWidth: 300,
              whiteSpace: 'normal',
            }}
            role="tooltip"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}; 

