import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Star, StickyNote as StickyNoteIcon, Plus, AlertTriangle, Timer, Play, Pause, RotateCcw, Settings } from 'lucide-react';
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
  
  // Pomodoro state
  const [pomodoroTimer, setPomodoroTimer] = useState<{
    taskId: string | null;
    timeRemaining: number; // in seconds
    isRunning: boolean;
  } | null>(null);
  const [pomodoroCounts, setPomodoroCounts] = useState<Record<string, number>>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('pomodoroCounts');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Pomodoro duration state (in minutes, stored in localStorage)
  // Global default duration (used as fallback)
  const [pomodoroDuration, setPomodoroDuration] = useState<number>(() => {
    const saved = localStorage.getItem('pomodoroDuration');
    return saved ? parseInt(saved, 10) : 20; // Default 20 minutes
  });
  // Per-task durations (taskId -> minutes)
  const [taskPomodoroDurations, setTaskPomodoroDurations] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('taskPomodoroDurations');
    return saved ? JSON.parse(saved) : {};
  });
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
  const [tempDurationInput, setTempDurationInput] = useState<string>('');
  const [editingTaskDuration, setEditingTaskDuration] = useState<string | null>(null);
  const [tempTaskDurationInput, setTempTaskDurationInput] = useState<string>('');
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);
  
  // Guard to prevent double counting on completion
  const completionProcessedRef = useRef<{ taskId: string | null; processed: boolean }>({ taskId: null, processed: false });

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

  // Helper to get duration for a task (per-task or fallback to default)
  const getTaskDuration = (taskId: string): number => {
    return taskPomodoroDurations[taskId] || pomodoroDuration;
  };

  // Pomodoro functions
  const startPomodoro = (taskId: string) => {
    const durationInSeconds = getTaskDuration(taskId) * 60;
    // Reset completion guard for new timer
    completionProcessedRef.current = { taskId, processed: false };
    // If there's already a timer running for a different task, stop it first
    if (pomodoroTimer && pomodoroTimer.taskId !== taskId) {
      // If starting a new task, stop the old timer completely
      setPomodoroTimer({
        taskId,
        timeRemaining: durationInSeconds,
        isRunning: true,
      });
    } else {
      // Same task - just start/reset
      setPomodoroTimer({
        taskId,
        timeRemaining: durationInSeconds,
        isRunning: true,
      });
    }
  };

  const pausePomodoro = () => {
    if (pomodoroTimer) {
      setPomodoroTimer({ ...pomodoroTimer, isRunning: false });
    }
  };

  const resumePomodoro = () => {
    if (pomodoroTimer && !pomodoroTimer.isRunning) {
      setPomodoroTimer({ ...pomodoroTimer, isRunning: true });
    }
  };

  const resetPomodoro = () => {
    if (pomodoroTimer && pomodoroTimer.taskId) {
      const durationInSeconds = getTaskDuration(pomodoroTimer.taskId) * 60;
      // Reset completion guard when resetting timer
      completionProcessedRef.current = { taskId: pomodoroTimer.taskId, processed: false };
      setPomodoroTimer({
        ...pomodoroTimer,
        timeRemaining: durationInSeconds,
        isRunning: false,
      });
    }
  };

  const stopPomodoro = () => {
    // Reset completion guard when stopping timer
    completionProcessedRef.current = { taskId: null, processed: false };
    setPomodoroTimer(null);
  };

  // Pomodoro settings functions
  const handlePresetDuration = (minutes: number) => {
    setPomodoroDuration(minutes);
    localStorage.setItem('pomodoroDuration', minutes.toString());
    // If timer is running, pause it and reset with new duration
    if (pomodoroTimer && pomodoroTimer.isRunning) {
      setPomodoroTimer({
        ...pomodoroTimer,
        timeRemaining: minutes * 60,
        isRunning: false,
      });
    } else if (pomodoroTimer) {
      // Timer exists but paused - just update duration
      setPomodoroTimer({
        ...pomodoroTimer,
        timeRemaining: minutes * 60,
      });
    }
    setShowPomodoroSettings(false);
  };

  const handleCustomDuration = () => {
    const minutes = parseInt(tempDurationInput, 10);
    if (minutes > 0 && minutes <= 999) {
      setPomodoroDuration(minutes);
      localStorage.setItem('pomodoroDuration', minutes.toString());
      // If timer is running, pause it and reset with new duration
      if (pomodoroTimer && pomodoroTimer.isRunning) {
        setPomodoroTimer({
          ...pomodoroTimer,
          timeRemaining: minutes * 60,
          isRunning: false,
        });
      } else if (pomodoroTimer) {
        // Timer exists but paused - just update duration
        setPomodoroTimer({
          ...pomodoroTimer,
          timeRemaining: minutes * 60,
        });
      }
      setTempDurationInput('');
      setShowPomodoroSettings(false);
    }
  };

  const openSettings = () => {
    setTempDurationInput(pomodoroDuration.toString());
    setShowPomodoroSettings(true);
  };

  // Per-task duration functions
  const openTaskDurationEditor = (taskId: string) => {
    setEditingTaskDuration(taskId);
    setTempTaskDurationInput(getTaskDuration(taskId).toString());
  };

  const handleTaskPresetDuration = (taskId: string, minutes: number) => {
    const newDurations = { ...taskPomodoroDurations, [taskId]: minutes };
    setTaskPomodoroDurations(newDurations);
    localStorage.setItem('taskPomodoroDurations', JSON.stringify(newDurations));
    
    // If timer is running for this task, update it
    if (pomodoroTimer && pomodoroTimer.taskId === taskId) {
      if (pomodoroTimer.isRunning) {
        setPomodoroTimer({
          ...pomodoroTimer,
          timeRemaining: minutes * 60,
          isRunning: false,
        });
      } else {
        setPomodoroTimer({
          ...pomodoroTimer,
          timeRemaining: minutes * 60,
        });
      }
    }
    
    setEditingTaskDuration(null);
  };

  const handleTaskCustomDuration = (taskId: string) => {
    const minutes = parseInt(tempTaskDurationInput, 10);
    if (minutes > 0 && minutes <= 999) {
      const newDurations = { ...taskPomodoroDurations, [taskId]: minutes };
      setTaskPomodoroDurations(newDurations);
      localStorage.setItem('taskPomodoroDurations', JSON.stringify(newDurations));
      
      // If timer is running for this task, update it
      if (pomodoroTimer && pomodoroTimer.taskId === taskId) {
        if (pomodoroTimer.isRunning) {
          setPomodoroTimer({
            ...pomodoroTimer,
            timeRemaining: minutes * 60,
            isRunning: false,
          });
        } else {
          setPomodoroTimer({
            ...pomodoroTimer,
            timeRemaining: minutes * 60,
          });
        }
      }
      
      setTempTaskDurationInput('');
      setEditingTaskDuration(null);
    }
  };

  const removeTaskDuration = (taskId: string) => {
    const newDurations = { ...taskPomodoroDurations };
    delete newDurations[taskId];
    setTaskPomodoroDurations(newDurations);
    localStorage.setItem('taskPomodoroDurations', JSON.stringify(newDurations));
    
    // If timer is running for this task, reset to default
    if (pomodoroTimer && pomodoroTimer.taskId === taskId) {
      if (pomodoroTimer.isRunning) {
        setPomodoroTimer({
          ...pomodoroTimer,
          timeRemaining: pomodoroDuration * 60,
          isRunning: false,
        });
      } else {
        setPomodoroTimer({
          ...pomodoroTimer,
          timeRemaining: pomodoroDuration * 60,
        });
      }
    }
    
    setEditingTaskDuration(null);
  };

  // Timer countdown effect
  useEffect(() => {
    if (!pomodoroTimer || !pomodoroTimer.isRunning) return;

    // Initialize guard if not already set for this timer
    if (pomodoroTimer.taskId && 
        (completionProcessedRef.current.taskId !== pomodoroTimer.taskId || 
         completionProcessedRef.current.processed)) {
      completionProcessedRef.current = { taskId: pomodoroTimer.taskId, processed: false };
    }

    const interval = setInterval(() => {
      setPomodoroTimer(prev => {
        if (!prev || !prev.isRunning) return prev;
        
        if (prev.timeRemaining <= 1) {
          // Timer completed
          const taskId = prev.taskId;
          
          // Guard: Only process completion once per timer instance
          if (taskId && !completionProcessedRef.current.processed && 
              completionProcessedRef.current.taskId === taskId) {
            // Mark as processed to prevent double counting
            completionProcessedRef.current.processed = true;
            
            // Increment pomodoro count
            setPomodoroCounts(prevCounts => {
              const newCounts = { ...prevCounts, [taskId]: (prevCounts[taskId] || 0) + 1 };
              localStorage.setItem('pomodoroCounts', JSON.stringify(newCounts));
              return newCounts;
            });
            
            // Highlight the completed task
            setCompletedTaskId(taskId);
            setTimeout(() => setCompletedTaskId(null), 3000); // Remove highlight after 3 seconds
            
            // Play sound notification
            playCompletionSound();
            
            // Show browser notification
            const task = tasks.find(t => t.id === taskId);
            const taskName = task?.text || 'Task';
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Pomodoro Complete! 🍅', {
                body: `Great work on "${taskName}"! Take a short break.`,
                icon: '/favicon.ico',
              });
            }
          }
          
          return { ...prev, timeRemaining: 0, isRunning: false };
        }
        
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pomodoroTimer?.isRunning, pomodoroTimer?.timeRemaining]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    if (!showPomodoroSettings && !editingTaskDuration) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.pomodoro-settings-container') && !target.closest('.task-duration-container')) {
        setShowPomodoroSettings(false);
        setEditingTaskDuration(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPomodoroSettings, editingTaskDuration]);

  // Format time helper (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Play sound notification when timer completes
  const playCompletionSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Pleasant completion sound (chime)
      oscillator.frequency.value = 800; // Higher frequency for pleasant chime
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);

      // Play second tone for double chime effect
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 1);
      }, 200);
    } catch (error) {
      // Fallback: silent failure if audio context is not available
      console.log('Audio notification not available');
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
          {/* Large Circular Timer - Replaces task list when timer is active and modal is closed */}
          {pomodoroTimer && pomodoroTimer.taskId && !showAllTasks ? (
            <div className="flex flex-col items-center justify-center py-8">
              {/* Circular Progress Timer */}
              <div className="relative w-48 h-48 mb-6">
                {/* SVG Circle for Progress */}
                <svg className="transform -rotate-90 w-full h-full">
                  {/* Background circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#pomodoroGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={
                      2 * Math.PI * 88 * (1 - 
                        (pomodoroTimer.taskId 
                          ? (getTaskDuration(pomodoroTimer.taskId) * 60 - pomodoroTimer.timeRemaining) / (getTaskDuration(pomodoroTimer.taskId) * 60)
                          : 0
                        )
                      )
                    }
                    className="transition-all duration-1000 ease-linear"
                  />
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Time Display in Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-gradient-primary">
                    {formatTime(pomodoroTimer.timeRemaining)}
                  </div>
                  {pomodoroTimer.taskId && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center px-4 max-w-[180px] truncate">
                      {tasks.find(t => t.id === pomodoroTimer.taskId)?.text || 'Task'}
                    </div>
                  )}
                </div>
              </div>
              {/* Timer Controls */}
              <div className="flex items-center gap-3">
                {pomodoroTimer.isRunning ? (
                  <button
                    onClick={pausePomodoro}
                    className="px-4 py-2 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                    title="Pause"
                  >
                    <Pause className="w-4 h-4" />
                    <span className="text-sm font-medium">Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={resumePomodoro}
                    className="px-4 py-2 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                    title="Resume"
                  >
                    <Play className="w-4 h-4" />
                    <span className="text-sm font-medium">Resume</span>
                  </button>
                )}
                <button
                  onClick={stopPomodoro}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
                  title="Stop"
                >
                  <span className="text-sm font-medium">Stop</span>
                </button>
              </div>
            </div>
          ) : (
            /* Tasks List (show only first 3) - Hidden when timer is active */
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
            {tasks.length > 0 && (
              <button className="w-full text-gradient-primary hover:underline text-xs mt-2" onClick={() => setShowAllTasks(true)}>View All Tasks</button>
            )}
          </div>
          )}
          {/* All Tasks Modal */}
          <Modal
            isOpen={showAllTasks}
            onRequestClose={() => {
              setShowAllTasks(false);
              setShowPomodoroSettings(false);
              setEditingTaskDuration(null);
            }}
            className="fixed inset-0 flex items-center justify-center z-50"
            overlayClassName="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-md z-40"
            ariaHideApp={false}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-lg relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Tasks</h2>
                <div className="flex items-center gap-2">
                  {/* Pomodoro Settings */}
                  <div className="relative pomodoro-settings-container">
                    <button
                      onClick={openSettings}
                      className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      title="Pomodoro Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    {showPomodoroSettings && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 z-10">
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <span className="text-gradient-primary">Default Pomodoro Duration (minutes)</span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                              Used for tasks without custom duration
                            </span>
                          </label>
                          <div className="flex gap-2 mb-3">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={tempDurationInput}
                              onChange={(e) => setTempDurationInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCustomDuration();
                                }
                              }}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-400 dark:focus:border-purple-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-purple-800"
                              placeholder="Custom"
                            />
                            <button
                              onClick={handleCustomDuration}
                              className="px-3 py-1 text-xs bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              Set
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[15, 25, 30, 45, 60].map((preset) => (
                              <button
                                key={preset}
                                onClick={() => handlePresetDuration(preset)}
                                className={`px-2 py-1 text-xs rounded transition-all duration-200 ${
                                  pomodoroDuration === preset
                                    ? 'bg-gradient-primary text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 hover:text-gray-900 dark:hover:text-white'
                                }`}
                              >
                                {preset}m
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPomodoroSettings(false)}
                          className="w-full px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                <button className="text-gray-400 hover:text-red-500" onClick={() => setShowAllTasks(false)}>&times;</button>
                </div>
              </div>
              <div className="space-y-2">
                {tasks
                  .sort((a, b) => {
                    // Sort by unfinished first (completed: false comes before completed: true)
                    if (a.completed === b.completed) return 0;
                    return a.completed ? 1 : -1;
                  })
                  .map(task => (
                  <div 
                    key={task.id} 
                    className={`bg-blue-50 dark:bg-blue-900/20 rounded p-2 flex items-center gap-2 transition-all duration-500 ${
                      completedTaskId === task.id 
                        ? 'ring-2 ring-green-400 dark:ring-green-500 bg-green-100 dark:bg-green-900/40 shadow-lg' 
                        : ''
                    }`}
                  >
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
                    {/* Pomodoro Controls */}
                    <div className="flex items-center gap-1">
                      {/* Duration Badge - Hidden when timer is active for this task */}
                      {!(pomodoroTimer?.taskId === task.id && (pomodoroTimer.timeRemaining > 0 || pomodoroTimer.isRunning)) && (
                        <div className="relative task-duration-container">
                          <button
                            onClick={() => openTaskDurationEditor(task.id)}
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              taskPomodoroDurations[task.id] 
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            } hover:opacity-80`}
                            title="Set Pomodoro Duration"
                          >
                            {getTaskDuration(task.id)}m
                          </button>
                        {editingTaskDuration === task.id && (
                          <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-20">
                            <div className="mb-2">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <span className="text-gradient-primary">Duration (minutes)</span>
                              </label>
                              <div className="flex gap-2 mb-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="999"
                                  value={tempTaskDurationInput}
                                  onChange={(e) => setTempTaskDurationInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleTaskCustomDuration(task.id);
                                    }
                                  }}
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-400 dark:focus:border-purple-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-purple-800"
                                  placeholder="Custom"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleTaskCustomDuration(task.id)}
                                  className="px-2 py-1 text-xs bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  Set
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {[7, 15, 20, 25, 30, 45, 60].map((preset) => (
                                  <button
                                    key={preset}
                                    onClick={() => handleTaskPresetDuration(task.id, preset)}
                                    className={`px-1.5 py-0.5 text-xs rounded transition-all duration-200 ${
                                      getTaskDuration(task.id) === preset
                                        ? 'bg-gradient-primary text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                  >
                                    {preset}m
                                  </button>
                                ))}
                              </div>
                              {taskPomodoroDurations[task.id] && (
                                <button
                                  onClick={() => removeTaskDuration(task.id)}
                                  className="w-full px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                                >
                                  Reset to Default ({pomodoroDuration}m)
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        </div>
                      )}
                      {/* Pomodoro Count Badge - Hidden when timer is active, shown when timer completes */}
                      {pomodoroCounts[task.id] > 0 && 
                       (pomodoroTimer?.taskId !== task.id || 
                        (pomodoroTimer?.taskId === task.id && pomodoroTimer?.timeRemaining === 0 && !pomodoroTimer?.isRunning)) && (
                        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                          🍅 {pomodoroCounts[task.id]}
                        </span>
                      )}
                      {/* Timer Display or Start Button */}
                      {pomodoroTimer?.taskId === task.id && (pomodoroTimer.timeRemaining > 0 || pomodoroTimer.isRunning) ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                            {formatTime(pomodoroTimer.timeRemaining)}
                          </span>
                          {pomodoroTimer.isRunning ? (
                            <button
                              onClick={pausePomodoro}
                              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                              title="Pause"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={resumePomodoro}
                              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                              title="Resume"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={resetPomodoro}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            title="Reset"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={stopPomodoro}
                            className="p-1 text-gray-500 hover:text-red-500"
                            title="Stop"
                          >
                            <span className="text-xs">×</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startPomodoro(task.id)}
                          className="p-1 text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                          title="Start Pomodoro"
                          disabled={task.completed}
                        >
                          <Timer className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button className="ml-1 text-gray-400 hover:text-red-500 flex-shrink-0" onClick={() => setConfirmDeleteTaskId(task.id)} disabled={saving}>&times;</button>
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

