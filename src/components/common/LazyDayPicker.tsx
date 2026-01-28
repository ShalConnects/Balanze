import React, { useState, useEffect, useRef } from 'react';
import { format, parse, isValid } from 'date-fns';

// Lazy-loaded DayPicker wrapper compatible with react-datepicker API
// Provides similar interface for easier migration
interface DayPickerProps {
  selected?: Date | null;
  onChange?: (date: Date | null) => void;
  onBlur?: () => void;
  placeholderText?: string;
  dateFormat?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  todayButton?: string;
  highlightDates?: Date[];
  isClearable?: boolean;
  autoComplete?: string;
  [key: string]: any; // Allow other props
}

export const LazyDayPicker: React.FC<DayPickerProps> = ({
  selected,
  onChange,
  onBlur,
  placeholderText = 'Select date...',
  dateFormat = 'yyyy-MM-dd',
  className = '',
  disabled = false,
  minDate,
  maxDate,
  todayButton,
  highlightDates,
  isClearable = false,
  autoComplete = 'off',
  ...otherProps
}) => {
  const [DayPicker, setDayPicker] = useState<any>(null);
  const [cssLoaded, setCssLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [month, setMonth] = useState<Date>(selected || new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy load react-day-picker
  useEffect(() => {
    if (!DayPicker && !cssLoaded && !loadError) {
      Promise.all([
        import('react-day-picker'),
        import('react-day-picker/dist/style.css')
      ]).then(([dayPickerModule]) => {
        setDayPicker(() => dayPickerModule.DayPicker);
        setCssLoaded(true);
        setLoadError(false);
      }).catch(() => {
        setLoadError(true);
      });
    }
  }, [DayPicker, cssLoaded, loadError]);

  // Update input value when selected date changes
  useEffect(() => {
    if (selected) {
      setInputValue(format(selected, dateFormat));
      setMonth(selected);
    } else {
      setInputValue('');
    }
  }, [selected, dateFormat]);

  // Handle input change (manual typing)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.trim() === '') {
      onChange?.(null);
      return;
    }

    const parsedDate = parse(value, dateFormat, new Date());
    if (isValid(parsedDate)) {
      onChange?.(parsedDate);
      setMonth(parsedDate);
    }
  };

  // Handle calendar date selection
  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.(null);
      setInputValue('');
      setIsOpen(false);
      return;
    }
    
    onChange?.(date);
    setInputValue(format(date, dateFormat));
    setMonth(date);
    setIsOpen(false);
  };

  // Handle clear button
  const handleClear = () => {
    onChange?.(null);
    setInputValue('');
    setIsOpen(false);
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      const today = new Date();
      if (!maxDate || today <= maxDate) {
        if (!minDate || today >= minDate) {
          handleSelect(today);
        }
      }
    }
  };

  if (!DayPicker || loadError) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={onBlur}
        placeholder={placeholderText}
        className={className}
        disabled={disabled || loadError}
        autoComplete={autoComplete}
        style={{ cursor: loadError ? 'not-allowed' : 'text', opacity: loadError ? 0.6 : 1 }}
        title={loadError ? 'Date picker unavailable. Please refresh the page.' : 'Loading date picker...'}
      />
    );
  }

  // Get today's date for highlighting
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Prepare modifiers for highlighting
  const modifiers = {
    today: today,
    ...(highlightDates && highlightDates.length > 0 ? {
      highlighted: highlightDates.map(d => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date;
      })
    } : {})
  };

  const modifiersClassNames = {
    today: 'rdp-day_today',
    selected: 'rdp-day_selected',
    disabled: 'rdp-day_disabled',
    ...(highlightDates && highlightDates.length > 0 ? {
      highlighted: 'rdp-day_highlighted'
    } : {})
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={onBlur}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          className={`${className} ${isClearable && inputValue ? 'pr-8' : ''}`}
          disabled={disabled}
          autoComplete={autoComplete}
          readOnly={false}
        />
        {isClearable && inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
            tabIndex={-1}
            aria-label="Clear date"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-[60] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <DayPicker
            mode="single"
            selected={selected || undefined}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={disabled ? true : undefined}
            fromDate={minDate}
            toDate={maxDate}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rdp"
            classNames={{
              months: 'rdp-months',
              month: 'rdp-month',
              caption: 'rdp-caption',
              caption_label: 'rdp-caption_label',
              nav: 'rdp-nav',
              button_previous: 'rdp-button_previous',
              button_next: 'rdp-button_next',
              month_caption: 'rdp-month_caption',
              table: 'rdp-table',
              head_row: 'rdp-head_row',
              head_cell: 'rdp-head_cell',
              row: 'rdp-row',
              cell: 'rdp-cell',
              day: 'rdp-day',
              day_button: 'rdp-day_button',
              day_selected: 'rdp-day_selected',
              day_today: 'rdp-day_today',
              day_disabled: 'rdp-day_disabled',
              day_outside: 'rdp-day_outside',
              day_hidden: 'rdp-day_hidden',
            }}
            {...otherProps}
          />
          {todayButton && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  if ((!minDate || today >= minDate) && (!maxDate || today <= maxDate)) {
                    handleSelect(today);
                  }
                }}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline text-center"
              >
                {todayButton}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
