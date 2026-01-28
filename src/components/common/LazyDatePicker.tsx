import React, { useState, useEffect, ComponentType } from 'react';

// Lazy-loaded DatePicker wrapper to reduce initial bundle size
// react-datepicker is only loaded when a date picker is actually used
interface DatePickerProps {
  [key: string]: any;
}

export const LazyDatePicker: React.FC<DatePickerProps> = (props) => {
  const [DatePicker, setDatePicker] = useState<ComponentType<any> | null>(null);
  const [cssLoaded, setCssLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Load DatePicker and its CSS only when component mounts
    if (!DatePicker && !cssLoaded && !loadError) {
      Promise.all([
        import('react-datepicker'),
        import('react-datepicker/dist/react-datepicker.css')
      ]).then(([datePickerModule]) => {
        setDatePicker(() => datePickerModule.default);
        setCssLoaded(true);
        setLoadError(false);
      }).catch(() => {
        // Silently handle loading errors - fallback input will be shown
        setLoadError(true);
      });
    }
  }, [DatePicker, cssLoaded, loadError]);

  if (!DatePicker) {
    // Fallback: simple input while DatePicker loads or if loading failed
    return (
      <input
        type="text"
        {...props}
        readOnly
        className={props.className}
        placeholder={props.placeholderText || props.placeholder || 'Select date...'}
        style={{ cursor: loadError ? 'not-allowed' : 'wait', opacity: 0.6 }}
        disabled={loadError}
        title={loadError ? 'Date picker unavailable. Please refresh the page.' : 'Loading date picker...'}
      />
    );
  }

  return <DatePicker {...props} />;
};

