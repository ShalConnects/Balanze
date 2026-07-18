import React from 'react';
import { format } from 'date-fns';
import { Plus, Search, Star } from 'lucide-react';
import { NOTE_FIELD, NOTE_SHELL, noteColorClass, parseNoteDate } from '../../constants/note';
import type { Note } from '../../types/note';

export type NotesListScope = 'day' | 'all';

interface NotesListPanelProps {
  notes: Note[];
  selectedId: string | null;
  loading: boolean;
  scope: NotesListScope;
  search: string;
  onScopeChange: (scope: NotesListScope) => void;
  onSearchChange: (value: string) => void;
  onSelect: (note: Note) => void;
  onNew: () => void;
}

const preview = (n: Note) => (n.title.trim() || n.text.trim() || 'Untitled').slice(0, 80);

const SCOPE_BTN =
  'flex-1 px-2 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-all';

export const NotesListPanel: React.FC<NotesListPanelProps> = ({
  notes,
  selectedId,
  loading,
  scope,
  search,
  onScopeChange,
  onSearchChange,
  onSelect,
  onNew,
}) => (
  <aside
    className={`${NOTE_SHELL} p-3 sm:p-4 flex flex-col min-h-[200px] lg:min-h-0 lg:max-h-[calc(100vh-7rem)] lg:sticky lg:top-2`}
  >
    <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
      <h3 className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Entries
      </h3>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">{notes.length}</span>
        <button
          type="button"
          onClick={onNew}
          title="New note for this day"
          className="p-1 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="shrink-0 space-y-2 mb-3">
      <div className="flex p-0.5 rounded-lg bg-white/70 dark:bg-gray-800/70 border border-blue-200/50 dark:border-blue-800/50">
        {([
          ['day', 'Day'],
          ['all', 'All'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onScopeChange(id)}
            className={`${SCOPE_BTN} ${
              scope === id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={scope === 'all' ? 'Search all entries…' : 'Search this day…'}
          className={`${NOTE_FIELD} pl-8 py-1.5 text-xs`}
        />
      </div>
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
      {loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Loading…</p>
      )}
      {!loading && notes.length === 0 && (
        <div className="rounded-xl border border-dashed border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-gray-800/40 px-3 py-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {search.trim() ? 'No matching notes.' : scope === 'all' ? 'No entries yet.' : 'No entry yet — start writing.'}
          </p>
        </div>
      )}
      {notes.map((note) => {
        const color = noteColorClass(note.color);
        const active = note.id === selectedId;
        return (
          <button
            key={note.id}
            type="button"
            onClick={() => onSelect(note)}
            className={`w-full text-left rounded-lg border px-2.5 py-2 ${color.bg} ${
              active ? 'border-blue-500 dark:border-blue-400' : color.border
            }`}
          >
            <div className="flex items-start gap-1.5">
              {note.pinned && <Star className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" fill="#facc15" />}
              <div className="min-w-0 flex-1">
                <p className={`text-xs text-gray-900 dark:text-white line-clamp-2 ${active ? 'font-semibold' : 'font-medium'}`}>{preview(note)}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  {format(parseNoteDate(note.entry_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </aside>
);
