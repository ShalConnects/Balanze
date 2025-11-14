import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { dropdownManager } from '../../utils/dropdownManager';

interface Option {
  label: React.ReactNode;
  value: string;
  icon?: React.ReactNode; // Optional icon
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  summaryMode?: boolean;
  onBlur?: () => void;
  className?: string;
  dropdownMenuClassName?: string;
  style?: React.CSSProperties;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, value, onChange, placeholder = 'Select...', disabled = false, fullWidth = true, summaryMode = false, onBlur, className, dropdownMenuClassName, style }) => {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const [dropdownAlign, setDropdownAlign] = useState<'left' | 'right'>('left');
  const [usePortal, setUsePortal] = useState(false);
  const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useMobileDetection();
  
  // Generate unique ID for this dropdown instance
  const dropdownId = useMemo(() => `dropdown-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`, []);
  
  // Close handler for dropdown manager
  const handleClose = useRef(() => {
    setOpen(false);
    if (onBlur) onBlur();
  });
  
  // Update close handler when onBlur changes
  useEffect(() => {
    handleClose.current = () => {
      setOpen(false);
      if (onBlur) onBlur();
    };
  }, [onBlur]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        dropdownManager.unregister(dropdownId);
        setOpen(false);
        if (onBlur) onBlur();
      }
    }
    if (open) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open, onBlur, dropdownId]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') {
        dropdownManager.unregister(dropdownId);
        setOpen(false);
        if (onBlur) onBlur();
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onBlur, dropdownId]);
  
  // Cleanup: unregister when component unmounts
  useEffect(() => {
    return () => {
      dropdownManager.unregister(dropdownId);
    };
  }, [dropdownId]);

  const selectedOption = options.find(opt => opt.value === value);

  // Calculate dropdown position - batched with requestAnimationFrame to avoid forced reflows
  const calculatePosition = () => {
    if (!buttonRef.current) return;
    
    // Batch all layout reads together
    requestAnimationFrame(() => {
      if (!buttonRef.current) return;
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 240; // Approximate max height
      const dropdownWidth = 240; // Approximate min width
      // Check if there's enough space below
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      // Horizontal alignment
      const spaceRight = viewportWidth - buttonRect.left;
      if (spaceRight < dropdownWidth && buttonRect.right > dropdownWidth) {
        setDropdownAlign('right');
      } else {
        setDropdownAlign('left');
      }
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    });
  };

  const handleToggle = () => {
    if (!open) {
      // Register with dropdown manager - this will close any other open dropdown
      dropdownManager.requestOpen(dropdownId, handleClose.current);
      
      calculatePosition();
      // Check if we need to use portal (inside scrollable container)
      if (buttonRef.current) {
        // Batch all layout reads together
        requestAnimationFrame(() => {
          if (!buttonRef.current) return;
          let parent = buttonRef.current.parentElement;
          let needsPortal = false;
          while (parent && parent !== document.body) {
            const overflow = window.getComputedStyle(parent).overflow;
            if (overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden') {
              const rect = parent.getBoundingClientRect();
              const buttonRect = buttonRef.current.getBoundingClientRect();
              if (rect.top <= buttonRect.top && rect.bottom >= buttonRect.bottom) {
                needsPortal = true;
                break;
              }
            }
            parent = parent.parentElement;
          }
          setUsePortal(needsPortal);
          if (needsPortal) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPortalPosition({ top: rect.bottom + 8, left: rect.left });
          }
        });
      }
      setOpen(true);
    } else {
      // Unregister when closing
      dropdownManager.unregister(dropdownId);
      setOpen(false);
    }
  };

  return (
    <div className={fullWidth ? 'relative w-full' : 'relative'}>
      <button
        type="button"
        ref={buttonRef}
        disabled={disabled}
        className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 text-gray-700 dark:text-gray-100 px-4 pr-[10px] py-2 text-[14px] h-10 rounded-lg border border-blue-200/50 dark:border-blue-800/50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 dark:hover:from-blue-800/30 dark:hover:via-indigo-800/30 dark:hover:to-purple-800/30 transition-colors flex items-center space-x-2 ${fullWidth ? 'w-full' : ''} focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
        style={style}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        onBlur={onBlur}
      >
        <span className={selectedOption ? '' : 'text-gray-400'}>
          {selectedOption && selectedOption.icon ? (
            <span className="inline-flex items-center mr-1">{selectedOption.icon}</span>
          ) : null}
          {selectedOption ? selectedOption.label : (summaryMode ? placeholder : placeholder)}
        </span>
        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <>
          {/* Mobile: Centered Modal */}
          {isMobile ? (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => {
                  dropdownManager.unregister(dropdownId);
                  setOpen(false);
                  if (onBlur) onBlur();
                }}
              />
              {/* Modal Content */}
              <div
                ref={menuRef}
                className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[70vh] w-[90vw] max-w-sm mx-4 overflow-hidden animate-fadein"
                tabIndex={-1}
              >
                {/* Options */}
                <div className="max-h-60 overflow-y-auto p-4">
                  {options.filter(opt => opt.value !== '').map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`w-full flex items-center text-left text-base rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors px-4 py-3 mb-1 ${value === opt.value ? 'bg-gradient-primary text-white font-semibold' : 'text-gray-700 dark:text-gray-100'}`}
                      onClick={() => {
                        onChange(opt.value);
                        dropdownManager.unregister(dropdownId);
                        setOpen(false);
                        if (onBlur) onBlur();
                      }}
                      role="option"
                      aria-selected={value === opt.value}
                    >
                      {opt.icon && <span className="mr-3">{opt.icon}</span>}
                      <span className="flex-1">{opt.label}</span>
                      {value === opt.value && (
                        <svg className="w-5 h-5 text-white ml-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Desktop: Traditional Dropdown */
            usePortal && open ? (
              createPortal(
                <div
                  ref={menuRef}
                  className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 shadow-xl rounded-xl z-[99999] max-h-60 overflow-y-auto text-xs p-1 animate-fadein ${dropdownMenuClassName || ''}`}
                  style={{ 
                    position: 'fixed',
                    top: `${portalPosition.top}px`,
                    left: `${portalPosition.left}px`,
                    minWidth: 140, 
                    maxWidth: 320,
                  }}
                  tabIndex={-1}
                  onClick={(e) => e.stopPropagation()}
                >
                  {options.filter(opt => opt.value !== '').map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`w-full flex items-center text-left text-xs rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors px-3 py-2 ${value === opt.value ? 'bg-gradient-primary text-white font-semibold' : 'text-gray-700 dark:text-gray-100'}`}
                      onClick={() => {
                        onChange(opt.value);
                        dropdownManager.unregister(dropdownId);
                        setOpen(false);
                        if (onBlur) onBlur();
                      }}
                      role="option"
                      aria-selected={value === opt.value}
                    >
                      {opt.icon && <span className="mr-2">{opt.icon}</span>}
                      <span className="flex-1">{opt.label}</span>
                      {value === opt.value && (
                        <svg className="w-4 h-4 text-white ml-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                  ))}
                </div>,
                document.body
              )
            ) : (
            <div
              ref={menuRef}
              className={`absolute ${dropdownAlign === 'left' ? 'left-0' : 'right-0'} w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 shadow-xl rounded-xl z-[99999] max-h-60 overflow-y-auto text-xs p-1 animate-fadein ${dropdownMenuClassName || ''} ${
                dropdownPosition === 'bottom' ? 'mt-2' : 'mb-2 bottom-full'
              }`}
              style={{ 
                minWidth: 140, 
                maxWidth: 320,
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 'auto'
              }}
              tabIndex={-1}
            >
              {options.filter(opt => opt.value !== '').map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`w-full flex items-center text-left text-xs rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors px-3 py-2 ${value === opt.value ? 'bg-gradient-primary text-white font-semibold' : 'text-gray-700 dark:text-gray-100'}`}
                  onClick={() => {
                    onChange(opt.value);
                    dropdownManager.unregister(dropdownId);
                    setOpen(false);
                    if (onBlur) onBlur();
                  }}
                  role="option"
                  aria-selected={value === opt.value}
                >
                  {opt.icon && <span className="mr-2">{opt.icon}</span>}
                  <span className="flex-1">{opt.label}</span>
                  {value === opt.value && (
                    <svg className="w-4 h-4 text-white ml-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  )}
                </button>
              ))}
            </div>
            )
          )}
        </>
      )}
    </div>
  );
}; 

