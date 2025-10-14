import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Star, StickyNote as StickyNoteIcon, Plus, AlertTriangle } from 'lucide-react';
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

interface Task {
  id: string;
  text: string;
  completed: boolean;
  user_id: string;
  created_at: string;
}

export const NotesAndTodosWidget: React.FC = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'notes' | 'todos'>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteColor, setNoteColor] = useState('yellow');
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todoInput, setTodoInput] = useState('');
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [lastWishCountdown, setLastWishCountdown] = useState<null | { daysLeft: number, nextCheckIn: string }>(null);

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

        // Refresh tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!tasksError && tasksData) setTasks(tasksData);
      } catch (error) {

      }
    };

    window.addEventListener('dataRefreshed', handleDataRefresh);
    return () => {
      window.removeEventListener('dataRefreshed', handleDataRefresh);
      // Cleanup timeouts on unmount
      if (editNote.timeoutId) clearTimeout(editNote.timeoutId);
      if (editTask.timeoutId) clearTimeout(editTask.timeoutId);
    };
  }, [user?.id]);

  // Add note
  const addNote = async () => {
    if (!noteInput.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        text: noteInput.trim(),
        color: noteColor,
        pinned: false,
      })
      .select();
    setSaving(false);
    if (!error && data && data[0]) {
      setNotes([data[0], ...notes]);
      setNoteInput('');
      setNoteColor('yellow');
    }
  };

  // Edit note with debounced auto-save
  const editNote = (id: string, text: string) => {
    // Update local state immediately for responsive UI
    setNotes(notes.map(n => n.id === id ? { ...n, text } : n));
    
    // Debounced save to database
    clearTimeout(editNote.timeoutId);
    editNote.timeoutId = setTimeout(async () => {
      try {
        await supabase
          .from('notes')
          .update({ text })
          .eq('id', id);
      } catch (error) {

      }
    }, 1000); // Save after 1 second of no typing
  };

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

  // Fetch tasks from Supabase - Fixed to prevent infinite calls
  useEffect(() => {
    if (!user?.id) return;
    
    let isMounted = true;
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (!error && data && isMounted) setTasks(data);
      } catch (error) {

      }
    };
    fetchTasks();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only depend on user.id, not the entire user object

  // Add task
  const addTask = async () => {
    if (!todoInput.trim() || !user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        text: todoInput.trim(),
        completed: false,
      })
      .select();
    setSaving(false);
    if (!error && data && data[0]) {
      setTasks([data[0], ...tasks]);
      setTodoInput('');
    }
  };

  // Edit task with debounced auto-save
  const editTask = (id: string, text: string) => {
    // Update local state immediately for responsive UI
    setTasks(tasks.map(t => t.id === id ? { ...t, text } : t));
    
    // Debounced save to database
    clearTimeout(editTask.timeoutId);
    editTask.timeoutId = setTimeout(async () => {
      try {
        await supabase
          .from('tasks')
          .update({ text })
          .eq('id', id);
      } catch (error) {

      }
    }, 1000); // Save after 1 second of no typing
  };

  // Toggle task completed
  const toggleTask = async (id: string, completed: boolean) => {
    setSaving(true);
    const { data: updated, error } = await supabase
      .from('tasks')
      .update({ completed: !completed })
      .eq('id', id)
      .select();
    setSaving(false);
    if (!error && updated && updated[0]) {
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !completed } : t));
    }
  };

  // Delete task
  const deleteTask = async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    setSaving(false);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== id));
      setConfirmDeleteTaskId(null);
    }
  };

  // Fetch Last Wish countdown - Temporarily disabled to fix 400 error
  // useEffect(() => {
  //   if (!user) return;
  //   const fetchLastWish = async () => {
  //     const { data, error } = await supabase
  //       .from('profiles') // Temporarily changed to avoid 406 error
  //       .select('*')
  //       .eq('user_id', user.id)
  //       .single();
  //     if (!error && data && data.is_enabled && data.last_check_in && data.check_in_frequency) {
  //       const lastCheckIn = new Date(data.last_check_in);
  //       const nextCheckIn = new Date(lastCheckIn.getTime() + data.check_in_frequency * 24 * 60 * 60 * 1000);
  //       const now = new Date();
  //       const daysLeft = Math.max(0, Math.ceil((nextCheckIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  //       setLastWishCountdown({ daysLeft, nextCheckIn: nextCheckIn.toLocaleDateString() });
  //     } else {
  //       setLastWishCountdown(null);
  //     }
  //   };
  //   fetchLastWish();
  // }, [user]);

  // In the notes tab, only show first 3 notes, and a 'View All Notes' link if more
  const notesToShow = notes.slice(0, 3);
  // In the tasks tab, only show first 3 tasks, and a 'View All Tasks' link if more
  const tasksToShow = tasks.slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-blue-900/40 rounded-xl p-4 mb-4 shadow-sm flex flex-col transition-all duration-300">
      {/* Last Wish Countdown Widget */}
      {lastWishCountdown && (
        <div className="mb-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-purple-500" />
          <div>
            <div className="text-sm font-semibold text-purple-800 dark:text-purple-200">Last Wish Check-in</div>
            <div className="text-xs text-purple-700 dark:text-purple-300">{lastWishCountdown.daysLeft} days left (next: {lastWishCountdown.nextCheckIn})</div>
          </div>
        </div>
      )}
      {/* Tabs */}
      <div className="flex mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 font-semibold focus:outline-none transition-colors duration-200 relative
            ${tab === 'notes' ? 'text-gradient-primary after:content-[""] after:absolute after:left-2 after:right-2 after:-bottom-[2px] after:h-[3px] after:rounded-full after:bg-gradient-to-r after:from-blue-500 after:to-purple-500' : 'text-gray-500 dark:text-gray-400'}
          `}
          style={{ borderBottom: tab === 'notes' ? 'none' : 'none' }}
          onClick={() => setTab('notes')}
        >
          Notes
        </button>
        <button
          className={`px-4 py-2 font-semibold focus:outline-none transition-colors duration-200 relative
            ${tab === 'todos' ? 'text-gradient-primary after:content-[""] after:absolute after:left-2 after:right-2 after:-bottom-[2px] after:h-[3px] after:rounded-full after:bg-gradient-to-r after:from-blue-500 after:to-purple-500' : 'text-gray-500 dark:text-gray-400'}
          `}
          style={{ borderBottom: tab === 'todos' ? 'none' : 'none' }}
          onClick={() => setTab('todos')}
        >
          To-Do
        </button>
      </div>
      {/* Notes Tab */}
      {tab === 'notes' && (
        <div>
          {/* Add Note */}
          <div className="flex mb-2">
            <input
              className="flex-1 rounded-l px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Add a note..."
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNote()}
              disabled={saving}
            />
            <button
              className="rounded-r bg-gradient-primary text-white px-3 py-2 font-bold flex items-center justify-center hover:bg-gradient-primary-hover transition-colors"
              onClick={addNote}
              disabled={saving}
              style={{ minWidth: 40 }}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {/* Notes List (show only first 3) */}
          <div className="space-y-2">
            {notesToShow.length === 0 && <div className="text-gray-400 text-sm">No notes yet.</div>}
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
      )}
      {/* To-Do Tab */}
      {tab === 'todos' && (
        <div>
          <div className="flex mb-2">
            <input
              className="flex-1 rounded-l px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Add a task..."
              value={todoInput}
              onChange={e => setTodoInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              disabled={saving}
            />
            <button
              className="rounded-r bg-gradient-primary text-white px-3 py-2 font-bold flex items-center justify-center hover:bg-gradient-primary-hover transition-colors"
              onClick={addTask}
              disabled={saving}
              style={{ minWidth: 40 }}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {/* Tasks List (show only first 3) */}
          <div className="space-y-2">
            {tasksToShow.length === 0 && <div className="text-gray-400 text-sm">No tasks yet.</div>}
            {tasksToShow.map(task => (
              <div key={task.id} className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 flex items-center">
                {confirmDeleteTaskId === task.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm text-red-600">Delete this task?</span>
                    <button className="px-2 py-1 text-xs bg-red-500 text-white rounded" onClick={() => deleteTask(task.id)} disabled={saving}>Delete</button>
                    <button className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded" onClick={() => setConfirmDeleteTaskId(null)} disabled={saving}>Cancel</button>
                  </div>
                ) : <>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id, task.completed)}
                  className="mr-2"
                  disabled={saving}
                />
                <input
                  className={`flex-1 bg-transparent border-none focus:outline-none text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}
                  value={task.text}
                  onChange={e => editTask(task.id, e.target.value)}
                  disabled={saving}
                />
                <button className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0" onClick={() => setConfirmDeleteTaskId(task.id)} disabled={saving}>&times;</button>
                </>}
              </div>
            ))}
            {tasks.length > 3 && (
              <button className="w-full text-gradient-primary hover:underline text-xs mt-2" onClick={() => setShowAllTasks(true)}>View All Tasks</button>
            )}
          </div>
          {/* All Tasks Modal */}
          <Modal
            isOpen={showAllTasks}
            onRequestClose={() => setShowAllTasks(false)}
            className="fixed inset-0 flex items-center justify-center z-50"
            overlayClassName="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-md z-40"
            ariaHideApp={false}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Tasks</h2>
                <button className="text-gray-400 hover:text-red-500" onClick={() => setShowAllTasks(false)}>&times;</button>
              </div>
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 flex items-center">
                    {confirmDeleteTaskId === task.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm text-red-600">Delete this task?</span>
                        <button className="px-2 py-1 text-xs bg-red-500 text-white rounded" onClick={() => deleteTask(task.id)} disabled={saving}>Delete</button>
                        <button className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded" onClick={() => setConfirmDeleteTaskId(null)} disabled={saving}>Cancel</button>
                      </div>
                    ) : <>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.completed)}
                      className="mr-2"
                      disabled={saving}
                    />
                    <input
                      className={`flex-1 bg-transparent border-none focus:outline-none text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}
                      value={task.text}
                      onChange={e => editTask(task.id, e.target.value)}
                      disabled={saving}
                    />
                    <button className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0" onClick={() => setConfirmDeleteTaskId(task.id)} disabled={saving}>&times;</button>
                    </>}
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}; 

