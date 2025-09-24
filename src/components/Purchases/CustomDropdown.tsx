import React, { useState, useRef, useEffect } from 'react';
import { useMobileDetection } from '../../hooks/useMobileDetection';

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useMobileDetection();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
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
  }, [open, onBlur]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') {
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
  }, [open, onBlur]);

  const selectedOption = options.find(opt => opt.value === value);

  // Calculate dropdown position
  const calculatePosition = () => {
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
  };

  const handleToggle = () => {
    if (!open) {
      calculatePosition();
    }
    setOpen(v => !v);
  };

  return (
    <div className={fullWidth ? 'relative w-full' : 'relative'}>
      <button
        type="button"
        ref={buttonRef}
        disabled={disabled}
        className={`bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 pr-[10px] py-2 text-[14px] h-10 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 ${fullWidth ? 'w-full' : ''} focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
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
          )}
        </>
      )}
    </div>
  );
}; 