import React, { useMemo } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NOTE_ICON_BTN, parseNoteDate, todayDateKey } from '../../constants/note';

interface NotesWeekStripProps {
  selectedDate: string;
  datesWithNotes: Set<string>;
  onSelect: (date: string) => void;
}

export const NotesWeekStrip: React.FC<NotesWeekStripProps> = ({
  selectedDate,
  datesWithNotes,
  onSelect,
}) => {
  const today = todayDateKey();
  const weekStart = useMemo(
    () => startOfWeek(parseNoteDate(selectedDate), { weekStartsOn: 1 }),
    [selectedDate]
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const shiftWeek = (dir: number) => {
    onSelect(format(addDays(parseNoteDate(selectedDate), dir * 7), 'yyyy-MM-dd'));
  };

  return (
    <div className="flex items-center gap-1">
      <button type="button" className={`${NOTE_ICON_BTN} !p-1.5`} aria-label="Previous week" onClick={() => shiftWeek(-1)}>
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <div className="flex-1 grid grid-cols-7 gap-1 min-w-0">
        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          const selected = key === selectedDate;
          const isToday = key === today;
          const hasNote = datesWithNotes.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-current={selected ? 'date' : undefined}
              className={`flex flex-col items-center rounded-lg py-1.5 transition-colors border ${
                selected
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent'
                  : isToday
                    ? 'border-blue-300 dark:border-blue-600 bg-white/80 dark:bg-gray-800/80 text-blue-700 dark:text-blue-300'
                    : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-800/70'
              }`}
            >
              <span className="text-[10px] font-medium leading-none">{format(d, 'EEEEE')}</span>
              <span className="text-sm font-semibold leading-tight mt-0.5 tabular-nums">{format(d, 'd')}</span>
              <span
                className={`mt-0.5 w-1 h-1 rounded-full ${
                  hasNote ? (selected ? 'bg-white' : 'bg-gradient-to-r from-blue-500 to-purple-500') : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      <button type="button" className={`${NOTE_ICON_BTN} !p-1.5`} aria-label="Next week" onClick={() => shiftWeek(1)}>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
