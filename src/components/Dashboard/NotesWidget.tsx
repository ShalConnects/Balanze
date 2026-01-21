import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Star, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import Modal from 'react-modal';

const NOTE_COLORS = [
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700', dot: 'bg-yellow-400 dark:bg-yellow-500' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-300 dark:border-pink-700', dot: 'bg-pink-400 dark:bg-pink-500' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700', dot: 'bg-blue-400 dark:bg-blue-500' },
  { name: 'Green', value: 'green', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700', dot: 'bg-green-400 dark:bg-green-500' },
];

interface Note {
  id: string;
  text: string;
  color: string;
  pinned: boolean;
  user_id: string;
}

interface NotesWidgetProps {
  isAccordionExpanded?: boolean;
  onAccordionToggle?: () => void;
}

export const NotesWidget: React.FC<NotesWidgetProps> = ({
  isAccordionExpanded = true,
  onAccordionToggle
}) => {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteColor, setNoteColor] = useState('yellow');
  const [saving, setSaving] = useState(false);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const addNoteInputRef = useRef<HTMLInputElement>(null);

  // Fetch notes from Supabase - Fixed to prevent infinite calls
  useEffect(() => {
    if (!user?.id) return;
    
    let isMounted = true;
    const fetchNotes = async () => {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('pinned', { ascending: false })
          .order('updated_at', { ascending: false });
        if (!error && data && isMounted) setNotes(data);
      } catch (error) {

      }
    };
    fetchNotes();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only depend on user.id, not the entire user object

  // Listen for global refresh events
  useEffect(() => {
    const handleDataRefresh = async () => {
      if (!user?.id) return;
      
      try {
        // Refresh notes
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('pinned', { ascending: false })
          .order('updated_at', { ascending: false });
        if (!notesError && notesData) setNotes(notesData);
      } catch (error) {

      }
    };

    window.addEventListener('dataRefreshed', handleDataRefresh);
    return () => {
      window.removeEventListener('dataRefreshed', handleDataRefresh);
    };
  }, [user?.id]);

  // Add note
  const addNote = async () => {
    if (!noteInput.trim() || !user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          text: noteInput.trim(),
          color: noteColor,
          pinned: false,
        })
        .select();
      
      if (error) {
        console.error('Error adding note:', error);
        setSaving(false);
        return;
      }
      
      if (data && data[0]) {
        setNotes([data[0], ...notes]);
        setNoteInput('');
        setNoteColor('yellow');
        // Keep focus on input field after adding note
        setTimeout(() => {
          addNoteInputRef.current?.focus();
        }, 0);
      }
    } catch (error) {
      console.error('Unexpected error adding note:', error);
    } finally {
      setSaving(false);
    }
  };

  // Edit note with debounced auto-save
  const editNote = (() => {
    let timeoutId: NodeJS.Timeout | null = null;
    return (id: string, text: string) => {
      // Update local state immediately for responsive UI
      setNotes(notes.map(n => n.id === id ? { ...n, text } : n));
      
      // Debounced save to database
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          await supabase
            .from('notes')
            .update({ text })
            .eq('id', id);
        } catch (error) {

        }
      }, 1000); // Save after 1 second of no typing
    };
  })();

  // Delete note
  const deleteNote = async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    setSaving(false);
    if (!error) {
      setNotes(notes.filter(n => n.id !== id));
      setConfirmDeleteNoteId(null);
    }
  };

  // Pin/unpin note
  const togglePin = async (id: string, pinned: boolean) => {
    setSaving(true);
    const { data: updated, error } = await supabase
      .from('notes')
      .update({ pinned: !pinned })
      .eq('id', id)
      .select();
    setSaving(false);
    if (!error && updated && updated[0]) {
      setNotes(notes => {
        const newNotes = notes.map(n => n.id === id ? { ...n, pinned: !pinned } : n);
        // Move pinned notes to top
        return [
          ...newNotes.filter(n => n.pinned),
          ...newNotes.filter(n => !n.pinned),
        ];
      });
    }
  };

  // Change color
  const changeColor = async (id: string, color: string) => {
    setSaving(true);
    const { data: updated, error } = await supabase
      .from('notes')
      .update({ color })
      .eq('id', id)
      .select();
    setSaving(false);
    if (!error && updated && updated[0]) {
      setNotes(notes.map(n => n.id === id ? { ...n, color } : n));
    }
  };

  // In the notes widget, only show first 3 notes, and a 'View All Notes' link if more
  const notesToShow = notes.slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-blue-900/40 rounded-xl p-4 shadow-sm flex flex-col transition-all duration-300 relative group">
      {/* Toggle Button - positioned like drag handle on left side, only when notes exist */}
      {notes.length > 0 && onAccordionToggle && (
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
      {/* Widget Header */}
      <div className={`mb-3 ${isAccordionExpanded ? '' : ''}`}>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Notes</h3>
      </div>
      {/* Quick Add Note Input - Always visible */}
      <div className="mb-3">
        <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg p-2 flex items-center gap-2 shadow-sm">
          <input
            ref={addNoteInputRef}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="Add a note..."
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && noteInput.trim()) {
                e.preventDefault();
                addNote();
              }
            }}
            disabled={saving}
          />
          <button
            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex-shrink-0 disabled:opacity-50"
            onClick={(e) => {
              e.preventDefault();
              if (noteInput.trim()) {
                addNote();
              }
            }}
            disabled={saving || !noteInput.trim()}
            title="Add note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Notes List (show only first 3) - Only show when expanded */}
      {isAccordionExpanded && (
        <div className="space-y-2">
          {notesToShow.length === 0 && <div className="text-gray-400 text-sm text-center">No notes yet.</div>}
          {notesToShow.map(note => {
            const colorObj = NOTE_COLORS.find(c => c.value === note.color) || NOTE_COLORS[0];
            return (
              <div key={note.id} className={`rounded p-2 flex items-center border ${colorObj.bg} ${colorObj.border} transition-all duration-200 shadow-sm group relative`}>
                {confirmDeleteNoteId === note.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm text-red-600">Delete this note?</span>
                    <button className="px-2 py-1 text-xs bg-red-500 text-white rounded" onClick={() => deleteNote(note.id)} disabled={saving}>Delete</button>
                    <button className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded" onClick={() => setConfirmDeleteNoteId(null)} disabled={saving}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <textarea
                      className="flex-1 bg-transparent border-none resize-none focus:outline-none text-sm text-gray-900 dark:text-white min-w-0"
                      value={note.text}
                      onChange={e => editNote(note.id, e.target.value)}
                      rows={2}
                      disabled={saving}
                    />
                    <button
                      className={`ml-2 text-gray-400 hover:text-yellow-500 ${note.pinned ? 'text-yellow-500' : ''}`}
                      title={note.pinned ? 'Unpin' : 'Pin'}
                      onClick={() => togglePin(note.id, note.pinned)}
                      disabled={saving}
                    >
                      <Star className="w-4 h-4" fill={note.pinned ? '#facc15' : 'none'} />
                    </button>
                    <div className="ml-2 flex-shrink-0 w-8 min-w-8 max-w-8">
                      <CustomDropdown
                        options={NOTE_COLORS.map(c => ({
                          label: <span className={`inline-block w-3 h-3 rounded-full ${c.dot}`}></span>,
                          value: c.value,
                        }))}
                        value={note.color}
                        onChange={color => changeColor(note.id, color)}
                        className="w-8 h-8 p-0 flex items-center justify-center bg-transparent border-none shadow-none"
                        dropdownMenuClassName="w-24"
                      />
                    </div>
                    <button className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0" onClick={() => setConfirmDeleteNoteId(note.id)} disabled={saving}>&times;</button>
                  </>
                )}
              </div>
            );
          })}
          {notes.length > 3 && (
            <button className="w-full text-gradient-primary hover:underline text-xs mt-2" onClick={() => setShowAllNotes(true)}>View All Notes</button>
          )}
        </div>
      )}
      {/* All Notes Modal */}
      <Modal
        isOpen={showAllNotes}
        onRequestClose={() => setShowAllNotes(false)}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-md z-40"
        ariaHideApp={false}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Notes</h2>
            <button className="text-gray-400 hover:text-red-500" onClick={() => setShowAllNotes(false)}>&times;</button>
          </div>
          <div className="space-y-2">
            {notes.map(note => {
              const colorObj = NOTE_COLORS.find(c => c.value === note.color) || NOTE_COLORS[0];
              return (
                <div key={note.id} className={`rounded p-2 flex items-center border ${colorObj.bg} ${colorObj.border} transition-all duration-200 shadow-sm group relative`}>
                  {confirmDeleteNoteId === note.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm text-red-600">Delete this note?</span>
                      <button className="px-2 py-1 text-xs bg-red-500 text-white rounded" onClick={() => deleteNote(note.id)} disabled={saving}>Delete</button>
                      <button className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded" onClick={() => setConfirmDeleteNoteId(null)} disabled={saving}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <textarea
                        className="flex-1 bg-transparent border-none resize-none focus:outline-none text-sm text-gray-900 dark:text-white min-w-0"
                        value={note.text}
                        onChange={e => editNote(note.id, e.target.value)}
                        rows={2}
                        disabled={saving}
                      />
                      <button
                        className={`ml-2 text-gray-400 hover:text-yellow-500 ${note.pinned ? 'text-yellow-500' : ''}`}
                        title={note.pinned ? 'Unpin' : 'Pin'}
                        onClick={() => togglePin(note.id, note.pinned)}
                        disabled={saving}
                      >
                        <Star className="w-4 h-4" fill={note.pinned ? '#facc15' : 'none'} />
                      </button>
                      <div className="ml-2 flex-shrink-0 w-8 min-w-8 max-w-8">
                        <CustomDropdown
                          options={NOTE_COLORS.map(c => ({
                            label: <span className={`inline-block w-3 h-3 rounded-full ${c.dot}`}></span>,
                            value: c.value,
                          }))}
                          value={note.color}
                          onChange={color => changeColor(note.id, color)}
                          className="w-8 h-8 p-0 flex items-center justify-center bg-transparent border-none shadow-none"
                          dropdownMenuClassName="w-24"
                        />
                      </div>
                      <button className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0" onClick={() => setConfirmDeleteNoteId(note.id)} disabled={saving}>&times;</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};
