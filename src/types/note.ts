export interface Note {
  id: string;
  user_id: string;
  title: string;
  text: string;
  color: string;
  pinned: boolean;
  entry_date: string;
  updated_at?: string;
  created_at?: string;
}

export type NoteWrite = {
  text: string;
  title?: string;
  color?: string;
  entry_date?: string;
  pinned?: boolean;
};

export type NotePatch = Partial<Pick<Note, 'title' | 'text' | 'color' | 'pinned' | 'entry_date'>>;
