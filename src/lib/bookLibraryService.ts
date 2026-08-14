import { supabase } from './supabase';
import type { BookLibraryInput, BookLibraryItem, BookReadingStatus } from '../types/bookLibrary';

export const BOOK_LIBRARY_CHANGED_EVENT = 'book-library-changed';

type DbBook = {
  id: string;
  title: string;
  author: string | null;
  owned: boolean;
  reading_status: string;
  note: string | null;
  created_at: string;
};

function mapBook(row: DbBook): BookLibraryItem {
  return {
    id: row.id,
    title: row.title,
    author: row.author ?? undefined,
    owned: Boolean(row.owned),
    reading_status:
      row.reading_status === 'reading' || row.reading_status === 'read' ? row.reading_status : 'unread',
    note: row.note ?? undefined,
    created_at: row.created_at
  };
}

function toRow(input: BookLibraryInput) {
  const title = input.title.trim();
  if (!title) throw new Error('Title is required');
  return {
    title,
    author: input.author?.trim() || null,
    owned: input.owned,
    reading_status: input.reading_status,
    note: input.note?.trim() || null
  };
}

export async function fetchBookLibrary(userId: string | undefined): Promise<BookLibraryItem[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('book_library')
    .select('id, title, author, owned, reading_status, note, created_at')
    .eq('user_id', userId)
    .order('title', { ascending: true });
  if (error) throw error;
  return ((data || []) as DbBook[]).map(mapBook);
}

export async function insertBookLibraryItem(input: BookLibraryInput): Promise<BookLibraryItem> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('Not signed in');
  const { data, error } = await supabase.from('book_library').insert({ user_id: uid, ...toRow(input) }).select().single();
  if (error) throw error;
  return mapBook(data as DbBook);
}

export async function updateBookLibraryItem(id: string, input: BookLibraryInput): Promise<void> {
  const { error } = await supabase
    .from('book_library')
    .update({ ...toRow(input), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteBookLibraryItem(id: string): Promise<void> {
  const { error } = await supabase.from('book_library').delete().eq('id', id);
  if (error) throw error;
}
