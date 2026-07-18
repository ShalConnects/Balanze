import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  createNote,
  deleteNoteById,
  fetchNotes,
  sortNotes,
  updateNote,
} from '../lib/noteService';
import type { Note, NotePatch, NoteWrite } from '../types/note';

export function useNotes() {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingRef = useRef<Map<string, NotePatch>>(new Map());

  const reload = useCallback(async () => {
    if (!user?.id) {
      setNotes([]);
      setLoading(false);
      return;
    }
    try {
      setNotes(await fetchNotes(user.id));
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  useEffect(() => {
    const onRefresh = () => {
      reload();
    };
    window.addEventListener('dataRefreshed', onRefresh);
    return () => window.removeEventListener('dataRefreshed', onRefresh);
  }, [reload]);

  useEffect(() => () => {
    debounceRef.current.forEach(clearTimeout);
    debounceRef.current.clear();
  }, []);

  const addNote = useCallback(async (input: NoteWrite) => {
    if (!user?.id) return null;
    if (!input.text.trim() && !(input.title ?? '').trim()) return null;
    setSaving(true);
    try {
      const created = await createNote(user.id, input);
      setNotes((prev) => sortNotes([created, ...prev]));
      return created;
    } catch {
      return null;
    } finally {
      setSaving(false);
    }
  }, [user?.id]);

  const applyLocal = useCallback((id: string, patch: NotePatch) => {
    setNotes((prev) => sortNotes(prev.map((n) => (n.id === id ? { ...n, ...patch } : n))));
  }, []);

  const patchNote = useCallback(async (id: string, patch: NotePatch, opts?: { debounceMs?: number }) => {
    applyLocal(id, patch);
    const ms = opts?.debounceMs;
    if (ms == null) {
      setSaving(true);
      try {
        const updated = await updateNote(id, patch);
        applyLocal(id, updated);
      } catch {
        await reload();
      } finally {
        setSaving(false);
      }
      return;
    }

    const pending = { ...(pendingRef.current.get(id) ?? {}), ...patch };
    pendingRef.current.set(id, pending);
    const timers = debounceRef.current;
    const prev = timers.get(id);
    if (prev) clearTimeout(prev);
    timers.set(
      id,
      setTimeout(async () => {
        timers.delete(id);
        const toSave = pendingRef.current.get(id);
        pendingRef.current.delete(id);
        if (!toSave) return;
        try {
          await updateNote(id, toSave);
        } catch {
          await reload();
        }
      }, ms)
    );
  }, [applyLocal, reload]);

  const removeNote = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await deleteNoteById(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const togglePin = useCallback(async (note: Note) => {
    await patchNote(note.id, { pinned: !note.pinned });
  }, [patchNote]);

  const changeColor = useCallback(async (id: string, color: string) => {
    await patchNote(id, { color });
  }, [patchNote]);

  return { notes, loading, saving, addNote, patchNote, removeNote, togglePin, changeColor, reload };
}
