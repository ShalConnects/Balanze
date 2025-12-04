import React, { useState, useEffect, ComponentType } from 'react';

// Lazy-loaded DatePicker wrapper to reduce initial bundle size
// react-datepicker is only loaded when a date picker is actually used
interface DatePickerProps {
  [key: string]: any;
}

export const LazyDatePicker: React.FC<DatePickerProps> = (props) => {
  const [DatePicker, setDatePicker] = useState<ComponentType<any> | null>(null);
  const [cssLoaded, setCssLoaded] = useState(false);

  useEffect(() => {
    // Load DatePicker and its CSS only when component mounts
    if (!DatePicker && !cssLoaded) {
      Promise.all([
        import('react-datepicker'),
        import('react-datepicker/dist/react-datepicker.css')
      ]).then(([datePickerModule]) => {
        setDatePicker(() => datePickerModule.default);
        setCssLoaded(true);
      }).catch((error) => {
        console.error('Failed to load DatePicker:', error);
      });
    }
  }, [DatePicker, cssLoaded]);

  if (!DatePicker) {
    // Fallback: simple input while DatePicker loads
    return (
      <input
        type="text"
        {...props}
        readOnly
        className={props.className}
        placeholder={props.placeholder || 'Select date...'}
        style={{ cursor: 'not-allowed', opacity: 0.6 }}
      />
    );
  }

  return <DatePicker {...props} />;
};

