import React from 'react';
import { Star } from 'lucide-react';
import { noteColorClass } from '../../constants/note';
import type { Note } from '../../types/note';
import { NoteColorPicker } from './NoteColorPicker';

interface NoteListItemProps {
  note: Note;
  saving?: boolean;
  confirmDelete?: boolean;
  showTitle?: boolean;
  compact?: boolean;
  onConfirmDelete: (id: string | null) => void;
  onDelete: (id: string) => void;
  onTogglePin: (note: Note) => void;
  onChangeColor: (id: string, color: string) => void;
  onChangeText: (id: string, text: string) => void;
  onChangeTitle?: (id: string, title: string) => void;
  textRows?: number;
}

export const NoteListItem: React.FC<NoteListItemProps> = ({
  note,
  saving,
  confirmDelete,
  showTitle,
  compact,
  onConfirmDelete,
  onDelete,
  onTogglePin,
  onChangeColor,
  onChangeText,
  onChangeTitle,
  textRows = 2,
}) => {
  const colorObj = noteColorClass(note.color);
  const shell = compact
    ? 'flex items-center gap-1.5 border-b border-blue-200/40 dark:border-blue-800/40 last:border-0 py-1.5'
    : `rounded-lg p-2.5 flex items-start border ${colorObj.bg} ${colorObj.border} transition-all duration-200 shadow-sm`;

  return (
    <div className={shell}>
      {confirmDelete ? (
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-red-600 dark:text-red-400">Delete this note?</span>
          <button className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors" onClick={() => onDelete(note.id)} disabled={saving}>Delete</button>
          <button className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" onClick={() => onConfirmDelete(null)} disabled={saving}>Cancel</button>
        </div>
      ) : (
        <>
          <div
            className={`flex-1 min-w-0 ${
              compact ? 'flex items-stretch gap-1.5' : 'space-y-1'
            }`}
          >
            {compact && (
              <span className={`w-0.5 my-px rounded-full flex-shrink-0 self-stretch ${colorObj.dot}`} />
            )}
            <div className={`min-w-0 ${compact ? 'flex-1 flex flex-col justify-center' : 'space-y-1'}`}>
              {showTitle && onChangeTitle && (
                <input
                  className="w-full bg-transparent border-none focus:outline-none text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400"
                  value={note.title}
                  placeholder="Title"
                  onChange={(e) => onChangeTitle(note.id, e.target.value)}
                  disabled={saving}
                />
              )}
              <textarea
                className={`w-full bg-transparent border-none resize-none focus:outline-none text-gray-900 dark:text-white min-w-0 ${
                  compact ? 'text-xs sm:text-sm leading-5 py-0' : 'text-sm'
                }`}
                value={note.text}
                onChange={(e) => onChangeText(note.id, e.target.value)}
                rows={textRows}
                disabled={saving}
              />
            </div>
          </div>
          <div className={`ml-1.5 flex items-center gap-1 flex-shrink-0 ${compact ? '' : 'mt-0.5'}`}>
            <button
              type="button"
              className={`text-gray-400 hover:text-yellow-500 ${note.pinned ? 'text-yellow-500' : ''}`}
              title={note.pinned ? 'Unpin' : 'Pin'}
              aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
              onClick={() => onTogglePin(note)}
              disabled={saving}
            >
              <Star className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill={note.pinned ? '#facc15' : 'none'} />
            </button>
            <NoteColorPicker
              value={note.color}
              compact={compact}
              disabled={saving}
              onChange={(color) => onChangeColor(note.id, color)}
            />
            <button
              type="button"
              className="text-gray-400 hover:text-red-500 leading-none text-base px-0.5"
              aria-label="Delete note"
              onClick={() => onConfirmDelete(note.id)}
              disabled={saving}
            >
              &times;
            </button>
          </div>
        </>
      )}
    </div>
  );
};
