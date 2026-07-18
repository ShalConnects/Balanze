import { supabase } from './supabase';
import { NOTE_SELECT, todayDateKey } from '../constants/note';
import type { Note, NotePatch, NoteWrite } from '../types/note';

export async function fetchNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(NOTE_SELECT)
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('entry_date', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function createNote(userId: string, input: NoteWrite): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      text: (input.text ?? '').trim(),
      title: (input.title ?? '').trim(),
      color: input.color ?? 'yellow',
      pinned: input.pinned ?? false,
      entry_date: input.entry_date ?? todayDateKey(),
    })
    .select(NOTE_SELECT)
    .single();
  if (error) throw error;
  return data as Note;
}

export async function updateNote(id: string, patch: NotePatch): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(NOTE_SELECT)
    .single();
  if (error) throw error;
  return data as Note;
}

export async function deleteNoteById(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.entry_date !== b.entry_date) return a.entry_date < b.entry_date ? 1 : -1;
    return (b.updated_at ?? '').localeCompare(a.updated_at ?? '');
  });
}
