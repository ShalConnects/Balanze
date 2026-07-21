import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import { todayDateKey } from '../../constants/note';
import { NoteListItem } from '../Notes/NoteListItem';
import {
  DASHBOARD_WIDGET_ACCORDION_BTN,
  DASHBOARD_WIDGET_BADGE,
  DASHBOARD_WIDGET_CONTENT,
  DASHBOARD_WIDGET_HEADER,
  DASHBOARD_WIDGET_HEADER_BORDER,
  DASHBOARD_WIDGET_SHELL,
  DASHBOARD_WIDGET_TITLE,
  DASHBOARD_WIDGET_VIEW_ALL,
} from '../../constants/dashboardWidget';

interface NotesWidgetProps {
  isAccordionExpanded?: boolean;
  onAccordionToggle?: () => void;
}

export const NotesWidget: React.FC<NotesWidgetProps> = ({
  isAccordionExpanded = true,
  onAccordionToggle,
}) => {
  const navigate = useNavigate();
  const { notes, saving, addNote, patchNote, removeNote, togglePin, changeColor } = useNotes();
  const [noteInput, setNoteInput] = useState('');
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);
  const addNoteInputRef = useRef<HTMLInputElement>(null);

  const today = todayDateKey();
  const todayNotes = useMemo(
    () => notes.filter((n) => n.entry_date === today),
    [notes, today]
  );
  const notesToShow = todayNotes.slice(0, 3);

  const handleAdd = async () => {
    if (!noteInput.trim()) return;
    const created = await addNote({ text: noteInput, entry_date: today });
    if (created) {
      setNoteInput('');
      setTimeout(() => addNoteInputRef.current?.focus(), 0);
    }
  };

  return (
    <div className={DASHBOARD_WIDGET_SHELL}>
      {todayNotes.length > 0 && onAccordionToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAccordionToggle();
          }}
          className={DASHBOARD_WIDGET_ACCORDION_BTN}
          title={isAccordionExpanded ? 'Collapse' : 'Expand'}
          aria-label={isAccordionExpanded ? 'Collapse widget' : 'Expand widget'}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isAccordionExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
          )}
        </button>
      )}

      <div
        className={`${DASHBOARD_WIDGET_HEADER} ${
          isAccordionExpanded ? DASHBOARD_WIDGET_HEADER_BORDER : ''
        }`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <h3 className={DASHBOARD_WIDGET_TITLE}>Notes</h3>
          {todayNotes.length > 0 && (
            <span className={`${DASHBOARD_WIDGET_BADGE} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`}>
              {todayNotes.length} today
            </span>
          )}
        </div>
        {notes.length > 0 && (
          <button type="button" onClick={() => navigate('/notes')} className={DASHBOARD_WIDGET_VIEW_ALL}>
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className={`${DASHBOARD_WIDGET_CONTENT} pt-2 ${isAccordionExpanded ? '' : 'pb-2'}`}>
        <div className="bg-white/90 dark:bg-gray-800/90 border border-blue-200/60 dark:border-blue-800/60 rounded-lg px-2 py-1.5 flex items-center gap-2">
          <input
            ref={addNoteInputRef}
            className="flex-1 bg-transparent border-none focus:outline-none text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="Add today's note..."
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && noteInput.trim()) {
                e.preventDefault();
                handleAdd();
              }
            }}
            disabled={saving}
          />
          <button
            className="p-0.5 rounded-md text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors flex-shrink-0 disabled:opacity-50"
            onClick={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            disabled={saving || !noteInput.trim()}
            title="Add note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isAccordionExpanded && (
        <div className={`${DASHBOARD_WIDGET_CONTENT} pb-1.5`}>
          {notesToShow.length === 0 && (
            <div className="text-gray-400 text-xs text-center py-3">
              {notes.length > 0 ? (
                <>
                  No notes for today —{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/notes')}
                    className={`${DASHBOARD_WIDGET_VIEW_ALL} inline-flex`}
                  >
                    {notes.length} older note{notes.length === 1 ? '' : 's'}
                  </button>
                </>
              ) : (
                'No notes for today.'
              )}
            </div>
          )}
          {notesToShow.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              compact
              textRows={1}
              saving={saving}
              confirmDelete={confirmDeleteNoteId === note.id}
              onConfirmDelete={setConfirmDeleteNoteId}
              onDelete={async (id) => {
                if (await removeNote(id)) setConfirmDeleteNoteId(null);
              }}
              onTogglePin={togglePin}
              onChangeColor={changeColor}
              onChangeText={(id, value) => patchNote(id, { text: value }, { debounceMs: 1000 })}
            />
          ))}
        </div>
      )}
    </div>
  );
};
