import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import { NOTE_LINK, NOTE_SHELL, todayDateKey } from '../../constants/note';
import { NoteListItem } from '../Notes/NoteListItem';

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
    <div className={`${NOTE_SHELL} p-4 flex flex-col transition-all duration-300 relative group hover:border-blue-300 dark:hover:border-blue-700`}>
      {todayNotes.length > 0 && onAccordionToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAccordionToggle();
          }}
          className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-manipulation transition-opacity"
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

      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Notes</h3>
        <button
          type="button"
          onClick={() => navigate('/notes')}
          className={NOTE_LINK}
        >
          Open diary
        </button>
      </div>

      <div className="mb-3">
        <div className="bg-white/90 dark:bg-gray-800/90 border border-blue-200/60 dark:border-blue-800/60 rounded-lg p-2 flex items-center gap-2 shadow-sm">
          <input
            ref={addNoteInputRef}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
            className="p-1 rounded-md text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors flex-shrink-0 disabled:opacity-50"
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
        <div className="space-y-2">
          {notesToShow.length === 0 && (
            <div className="text-gray-400 text-sm text-center">No notes for today.</div>
          )}
          {notesToShow.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
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
          {(todayNotes.length > 3 || notes.length > todayNotes.length) && (
            <button
              type="button"
              className={`w-full ${NOTE_LINK} mt-2`}
              onClick={() => navigate('/notes')}
            >
              Open diary
            </button>
          )}
        </div>
      )}
    </div>
  );
};
