import React, { useEffect, useRef, useState } from 'react';
import { NOTE_COLORS, noteColorClass } from '../../constants/note';

interface NoteColorPickerProps {
  value: string;
  disabled?: boolean;
  compact?: boolean;
  onChange: (color: string) => void;
}

export const NoteColorPicker: React.FC<NoteColorPickerProps> = ({ value, disabled, compact, onChange }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = noteColorClass(value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        type="button"
        title="Color"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} rounded-full border border-black/10 dark:border-white/20 shadow-sm hover:scale-110 transition-transform disabled:opacity-50 flex items-center justify-center`}
        aria-label="Change note color"
        aria-expanded={open}
      >
        <span className={`block ${compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} rounded-full ${current.dot}`} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-7 z-50 flex items-center gap-1.5 p-1.5 rounded-lg border border-blue-200/60 dark:border-blue-800/60 bg-white dark:bg-gray-800 shadow-lg"
          role="listbox"
        >
          {NOTE_COLORS.map((c) => {
            const selected = c.value === value;
            return (
              <button
                key={c.value}
                type="button"
                role="option"
                aria-selected={selected}
                title={c.name}
                onClick={() => {
                  onChange(c.value);
                  setOpen(false);
                }}
                className={`w-5 h-5 rounded-full ${c.dot} transition-transform hover:scale-110 ${
                  selected ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-800 scale-110' : ''
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
