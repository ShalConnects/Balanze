import React from 'react';
import { Star } from 'lucide-react';
import { NoteColorPicker } from './NoteColorPicker';

interface NotesEditorProps {
  title: string;
  text: string;
  color: string;
  pinned: boolean;
  saving?: boolean;
  isNew: boolean;
  confirmDelete: boolean;
  onTitle: (v: string) => void;
  onText: (v: string) => void;
  onTogglePin: () => void;
  onChangeColor: (color: string) => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  title,
  text,
  color,
  pinned,
  saving,
  isNew,
  confirmDelete,
  onTitle,
  onText,
  onTogglePin,
  onChangeColor,
  onAskDelete,
  onCancelDelete,
  onDelete,
}) => (
  <div className="rounded-xl border border-blue-200/60 dark:border-blue-800/60 bg-white/90 dark:bg-gray-800/90 p-3 sm:p-4 flex flex-col min-h-[280px] sm:min-h-[360px] shadow-sm">
    {confirmDelete ? (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">Delete this note?</p>
        <div className="flex gap-2">
          <button type="button" className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md" onClick={onDelete} disabled={saving}>Delete</button>
          <button type="button" className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-md" onClick={onCancelDelete} disabled={saving}>Cancel</button>
        </div>
      </div>
    ) : (
      <>
        <div className="flex items-center gap-2 mb-2">
          <input
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Title (optional)"
            className="flex-1 min-w-0 bg-transparent border-none focus:outline-none text-base font-semibold text-gray-900 dark:text-white placeholder:text-gray-400"
            disabled={saving}
          />
          {!isNew && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                className={`text-gray-400 hover:text-yellow-500 ${pinned ? 'text-yellow-500' : ''}`}
                title={pinned ? 'Unpin' : 'Pin'}
                onClick={onTogglePin}
                disabled={saving}
              >
                <Star className="w-4 h-4" fill={pinned ? '#facc15' : 'none'} />
              </button>
              <NoteColorPicker value={color} disabled={saving} onChange={onChangeColor} />
              <button type="button" className="text-gray-400 hover:text-red-500 text-lg leading-none px-0.5" onClick={onAskDelete} disabled={saving}>&times;</button>
            </div>
          )}
        </div>
        <div className="h-px bg-gradient-to-r from-blue-200/80 via-purple-200/80 to-transparent dark:from-blue-800/60 dark:via-purple-800/60 mb-3" />
        <textarea
          value={text}
          onChange={(e) => onText(e.target.value)}
          placeholder="What happened today?"
          className="flex-1 w-full min-h-[200px] bg-transparent border-none resize-none focus:outline-none text-sm sm:text-base text-gray-900 dark:text-white placeholder:text-gray-400 leading-relaxed"
          disabled={saving}
        />
        {(saving || (isNew && (title.trim() || text.trim()))) && (
          <p className="text-[11px] text-gray-400 mt-2">Saving…</p>
        )}
        {isNew && !title.trim() && !text.trim() && (
          <p className="text-[11px] text-gray-400 mt-2">Start typing to create this day’s entry</p>
        )}
      </>
    )}
  </div>
);
