import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { BookOpen } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import {
  NOTE_PRIMARY_BTN,
  NOTE_SHELL,
  todayDateKey,
} from '../../constants/note';
import type { Note } from '../../types/note';
import { NotesEditor } from './NotesEditor';
import { NotesListPanel, type NotesListScope } from './NotesListPanel';
import { NotesWeekStrip } from './NotesWeekStrip';

export const NotesDiaryPage: React.FC = () => {
  const { notes, loading, saving, addNote, patchNote, removeNote, togglePin, changeColor } = useNotes();
  const [selectedDate, setSelectedDate] = useState(todayDateKey);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composingNew, setComposingNew] = useState(false);
  const [listScope, setListScope] = useState<NotesListScope>('day');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState({ title: '', text: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const creatingRef = useRef(false);
  const selectedIdRef = useRef(selectedId);
  const draftRef = useRef(draft);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  draftRef.current = draft;
  selectedIdRef.current = selectedId;

  const q = search.trim().toLowerCase();
  const isToday = selectedDate === todayDateKey();
  const active = useMemo(
    () => (selectedId ? notes.find((n) => n.id === selectedId) ?? null : null),
    [notes, selectedId]
  );

  const datesWithNotes = useMemo(() => new Set(notes.map((n) => n.entry_date)), [notes]);

  const listNotes = useMemo(() => {
    const base = listScope === 'all' ? notes : notes.filter((n) => n.entry_date === selectedDate);
    if (!q) return base;
    return base.filter(
      (n) => n.title.toLowerCase().includes(q) || n.text.toLowerCase().includes(q)
    );
  }, [notes, q, selectedDate, listScope]);

  useEffect(() => {
    if (composingNew) return;
    const forDay = notes.filter((n) => n.entry_date === selectedDate);
    setConfirmDelete(false);
    setSelectedId((prev) => {
      if (prev && forDay.some((n) => n.id === prev)) return prev;
      if (prev && notes.some((n) => n.id === prev)) return prev;
      return forDay[0]?.id ?? null;
    });
  }, [selectedDate, notes, composingNew]);

  useEffect(() => () => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
  }, []);

  const dayLabel = useMemo(() => {
    try {
      return format(parseISO(selectedDate), 'EEEE, MMM d, yyyy');
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const selectDate = (date: string) => {
    setComposingNew(false);
    setSelectedDate(date);
    setListScope('day');
    setDraft({ title: '', text: '' });
  };

  const selectNote = (note: Note) => {
    setComposingNew(false);
    setSelectedId(note.id);
    setSelectedDate(note.entry_date);
    setConfirmDelete(false);
  };

  const startNew = () => {
    setComposingNew(true);
    setSelectedId(null);
    setDraft({ title: '', text: '' });
    setConfirmDelete(false);
  };

  const createFromDraft = (next: { title: string; text: string }) => {
    if (creatingRef.current) return;
    if (!next.title.trim() && !next.text.trim()) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(async () => {
      if (creatingRef.current || selectedIdRef.current) return;
      creatingRef.current = true;
      const created = await addNote({
        title: draftRef.current.title,
        text: draftRef.current.text,
        entry_date: selectedDate,
      });
      creatingRef.current = false;
      if (!created) return;
      setComposingNew(false);
      setSelectedId(created.id);
      const latest = draftRef.current;
      if (latest.title !== created.title || latest.text !== created.text) {
        await patchNote(created.id, latest);
      }
    }, 450);
  };

  const onTitle = (title: string) => {
    if (active) {
      patchNote(active.id, { title }, { debounceMs: 800 });
      return;
    }
    const next = { ...draft, title };
    setDraft(next);
    createFromDraft(next);
  };

  const onText = (text: string) => {
    if (active) {
      patchNote(active.id, { text }, { debounceMs: 800 });
      return;
    }
    const next = { ...draft, text };
    setDraft(next);
    createFromDraft(next);
  };

  const handleDelete = async () => {
    if (!active) return;
    const ok = await removeNote(active.id);
    if (ok) {
      setConfirmDelete(false);
      setComposingNew(false);
      setSelectedId(null);
      setDraft({ title: '', text: '' });
    }
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto flex flex-col gap-4 lg:grid lg:grid-cols-8 lg:gap-4 lg:items-start">
      <div className={`lg:col-span-5 ${NOTE_SHELL} p-3 sm:p-5 space-y-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pt-1.5 truncate">
              {dayLabel}
            </h2>
          </div>
          {!isToday && (
            <button
              type="button"
              onClick={() => selectDate(todayDateKey())}
              className={`${NOTE_PRIMARY_BTN} text-xs whitespace-nowrap shrink-0`}
            >
              Today
            </button>
          )}
        </div>

        <NotesWeekStrip
          selectedDate={selectedDate}
          datesWithNotes={datesWithNotes}
          onSelect={selectDate}
        />

        <NotesEditor
          title={active ? active.title : draft.title}
          text={active ? active.text : draft.text}
          color={active?.color ?? 'yellow'}
          pinned={active?.pinned ?? false}
          saving={saving}
          isNew={!active}
          confirmDelete={confirmDelete}
          onTitle={onTitle}
          onText={onText}
          onTogglePin={() => active && togglePin(active)}
          onChangeColor={(color) => active && changeColor(active.id, color)}
          onAskDelete={() => setConfirmDelete(true)}
          onCancelDelete={() => setConfirmDelete(false)}
          onDelete={handleDelete}
        />
      </div>

      <div className="lg:col-span-3">
        <NotesListPanel
          notes={listNotes}
          selectedId={selectedId}
          loading={loading}
          scope={listScope}
          search={search}
          onScopeChange={setListScope}
          onSearchChange={setSearch}
          onSelect={selectNote}
          onNew={startNew}
        />
      </div>
    </div>
  );
};

export default NotesDiaryPage;
