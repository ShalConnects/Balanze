import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Timer, Play, Pause, RotateCcw, Settings, GripVertical, X, ChevronDown, RefreshCw, ChevronRight, Plus } from 'lucide-react';
import Modal from 'react-modal';
import type { Task } from '../../types/index';

interface TodosWidgetProps {
  isAccordionExpanded?: boolean;
  onAccordionToggle?: () => void;
}

export const TodosWidget: React.FC<TodosWidgetProps> = ({
  isAccordionExpanded = true,
  onAccordionToggle
}) => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todoInput, setTodoInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAddTaskInput, setShowAddTaskInput] = useState(false);
  
  // Force re-render every second to sync timer display with PomodoroTimerBar
  const [, setTick] = useState(0);
  
  // Accordion section states (Today open by default)
  const [expandedSections, setExpandedSections] = useState({
    today: true,
    thisWeek: false,
    thisMonth: false,
  });
  
  // Task filter state: 'all' | 'parent-only' | 'standalone-only'
  const [taskFilter, setTaskFilter] = useState<'all' | 'parent-only' | 'standalone-only'>(() => {
    const saved = localStorage.getItem('taskFilter');
    return (saved === 'parent-only' || saved === 'standalone-only') ? saved : 'all';
  });
  
  // View mode state: 'time-based' | 'parent-based'
  const [viewMode, setViewMode] = useState<'time-based' | 'parent-based'>(() => {
    const saved = localStorage.getItem('taskViewMode');
    return (saved === 'parent-based') ? 'parent-based' : 'time-based';
  });
  
  // Persist filter to localStorage
  useEffect(() => {
    localStorage.setItem('taskFilter', taskFilter);
  }, [taskFilter]);
  
  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem('taskViewMode', viewMode);
  }, [viewMode]);
  
  // Pomodoro state - with localStorage persistence
  const [pomodoroTimer, setPomodoroTimer] = useState<{
    taskId: string | null;
    timeRemaining: number; // in seconds (calculated from endTime)
    isRunning: boolean;
    endTime: number | null; // timestamp when timer should end (null when paused)
  } | null>(() => {
    // Restore timer state from localStorage on mount
    const saved = localStorage.getItem('pomodoroTimerState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If timer was running, check if it's still valid (not expired)
        if (parsed.endTime && parsed.isRunning) {
          const now = Date.now();
          const timeRemaining = Math.max(0, Math.floor((parsed.endTime - now) / 1000));
          if (timeRemaining <= 0) {
            // Timer expired while away, return null
            localStorage.removeItem('pomodoroTimerState');
            return null;
          }
          return {
            ...parsed,
            timeRemaining,
          };
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
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
  
  // Drag and drop state for task reordering
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<'today' | 'this_week' | 'this_month' | null>(null);
  
  // Expanded tasks state (for showing/hiding subtasks)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('expandedTasks');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  // State for adding subtasks
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [subtaskInput, setSubtaskInput] = useState('');
  
  // Guard to prevent double counting on completion
  const completionProcessedRef = useRef<{ taskId: string | null; processed: boolean }>({ taskId: null, processed: false });
  
  // Ref for add task input field
  const addTaskInputRef = useRef<HTMLInputElement>(null);

  // Edit task with debounced auto-save
  const editTask = (() => {
    let timeoutId: NodeJS.Timeout | null = null;
    return (id: string, text: string) => {
      // Update local state immediately for responsive UI
      setTasks(tasks.map(t => t.id === id ? { ...t, text } : t));
      
      // Debounced save to database
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          await supabase
            .from('tasks')
            .update({ text })
            .eq('id', id);
        } catch (error) {

        }
      }, 1000); // Save after 1 second of no typing
    };
  })();

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
          .order('position', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
        if (!error && data && isMounted) {
          // Organize tasks into hierarchy with subtasks
          const { organizeTasksWithSubtasks } = await import('../../utils/taskUtils');
          const organizedTasks = organizeTasksWithSubtasks(data);
          setTasks(organizedTasks);
        }
      } catch (error) {

      }
    };
    fetchTasks();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only depend on user.id, not the entire user object

  // Listen for global refresh events
  useEffect(() => {
    const handleDataRefresh = async () => {
      if (!user?.id) return;
      
      try {
        // Refresh tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('position', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
        if (!tasksError && tasksData) {
          const { organizeTasksWithSubtasks } = await import('../../utils/taskUtils');
          const organizedTasks = organizeTasksWithSubtasks(tasksData);
          setTasks(organizedTasks);
        }
      } catch (error) {

      }
    };

    window.addEventListener('dataRefreshed', handleDataRefresh);
    return () => {
      window.removeEventListener('dataRefreshed', handleDataRefresh);
    };
  }, [user?.id]);

  // Add task
  const addTask = async () => {
    if (!todoInput.trim() || !user) return;
    setSaving(true);
    try {
      // Calculate position for new task (should be at the top)
      const minPosition = tasks.length > 0 
        ? Math.min(...tasks.map(t => t.position || 0))
        : 0;
      const newPosition = minPosition - 1;
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          text: todoInput.trim(),
          completed: false,
          position: newPosition,
        })
        .select();
      
      if (error) {
        console.error('Error adding task:', error);
        setSaving(false);
        return;
      }
      
      if (data && data[0]) {
        // Refresh all tasks to get organized hierarchy
        const { data: allTasks, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('position', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
        
        if (fetchError) {
          console.error('Error fetching tasks after add:', fetchError);
        } else if (allTasks) {
          const { organizeTasksWithSubtasks } = await import('../../utils/taskUtils');
          const organizedTasks = organizeTasksWithSubtasks(allTasks);
          setTasks(organizedTasks);
        }
        setTodoInput('');
        // Reset filter to 'all' so the newly added task is visible
        if (taskFilter !== 'all') {
          setTaskFilter('all');
        }
        // Keep focus on input field after adding task
        setTimeout(() => {
          addTaskInputRef.current?.focus();
        }, 0);
      }
    } catch (error) {
      console.error('Unexpected error adding task:', error);
    } finally {
      setSaving(false);
    }
  };

  // Helper function to find a task by ID (searches both parent tasks and subtasks)
  const findTaskById = (taskId: string): Task | undefined => {
    // First check parent tasks
    const parentTask = tasks.find(t => t.id === taskId);
    if (parentTask) return parentTask;
    
    // Then check all subtasks
    for (const parent of tasks) {
      if (parent.subtasks) {
        const subtask = parent.subtasks.find(st => st.id === taskId);
        if (subtask) return subtask;
      }
    }
    
    return undefined;
  };

  // Toggle task completed
  const toggleTask = async (id: string, completed: boolean) => {
    setSaving(true);
    
    // Find the task being toggled (searches both parent tasks and subtasks)
    const task = findTaskById(id);
    
    if (!task) {
      setSaving(false);
      return;
    }
    
    const isParentTask = task && !task.parent_id && task.has_subtasks && task.subtasks && task.subtasks.length > 0;
    const newCompletedState = !completed;
    
    // Update the task in database
    const { data: updated, error } = await supabase
      .from('tasks')
      .update({ completed: newCompletedState })
      .eq('id', id)
      .select();
    
    // If it's a parent task, update all subtasks
    if (!error && updated && updated[0] && isParentTask && task.subtasks) {
      const subtaskIds = task.subtasks.map(st => st.id);
      
      if (subtaskIds.length > 0) {
        await supabase
          .from('tasks')
          .update({ completed: newCompletedState })
          .in('id', subtaskIds);
      }
    }
    
    setSaving(false);
    if (!error && updated && updated[0]) {
      const updatedTask = updated[0];
      
      // Update task in state
      const updatedTasks = tasks.map(t => {
        if (t.id === id) {
          // If it's a parent task with subtasks, also update all subtasks in the array
          if (isParentTask && t.subtasks && t.subtasks.length > 0) {
            const updatedSubtasks = t.subtasks.map(st => ({ ...st, completed: newCompletedState }));
            const completedCount = updatedSubtasks.filter(st => st.completed).length;
            return {
              ...t,
              completed: newCompletedState,
              subtasks: updatedSubtasks,
              completed_subtasks_count: completedCount,
            };
          }
          return { ...t, completed: newCompletedState };
        }
        // If this is a subtask of the toggled parent, update it (for standalone subtasks in top-level array - shouldn't happen but just in case)
        if (isParentTask && task.subtasks && task.subtasks.some(st => st.id === t.id)) {
          return { ...t, completed: newCompletedState };
        }
        // If this parent has the toggled subtask, update the subtask in the parent's subtasks array
        if (task && task.parent_id && t.id === task.parent_id && t.subtasks) {
          const updatedSubtasks = t.subtasks.map(st => 
            st.id === id ? { ...st, completed: newCompletedState } : st
          );
          const completedCount = updatedSubtasks.filter(st => st.completed).length;
          const allSubtasksCompleted = completedCount === updatedSubtasks.length && updatedSubtasks.length > 0;
          
          // Auto-complete parent if all subtasks are completed
          if (allSubtasksCompleted && !t.completed) {
            supabase
              .from('tasks')
              .update({ completed: true })
              .eq('id', t.id);
            return {
              ...t,
              subtasks: updatedSubtasks,
              completed_subtasks_count: completedCount,
              completed: true,
            };
          }
          
          return {
            ...t,
            subtasks: updatedSubtasks,
            completed_subtasks_count: completedCount,
          };
        }
        return t;
      });
      
      setTasks(updatedTasks);
      
      // For subtasks, refresh from database to ensure UI is fully in sync
      if (!isParentTask && task && task.parent_id) {
        // Refresh all tasks to get updated hierarchy
        const { data: allTasks, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user?.id)
          .order('position', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
        
        if (!fetchError && allTasks) {
          const { organizeTasksWithSubtasks } = await import('../../utils/taskUtils');
          const organizedTasks = organizeTasksWithSubtasks(allTasks);
          setTasks(organizedTasks);
        }
      }
      
      // Check if we need to auto-complete parent (for subtasks only, not parent tasks)
      if (!isParentTask && task && task.parent_id && !completed && newCompletedState) {
        // Subtask was just completed, check if all siblings are done
        const parent = updatedTasks.find(t => t.id === task.parent_id);
        
        if (parent && parent.subtasks) {
          const allDone = parent.subtasks.every(st => st.completed);
          
          if (allDone && parent.subtasks.length > 0 && !parent.completed) {
            // Auto-complete parent
            setSaving(true);
            await supabase
              .from('tasks')
              .update({ completed: true })
              .eq('id', parent.id);
            setSaving(false);
            
            // Refresh tasks to ensure UI is in sync
            const { data: allTasks, error: fetchError } = await supabase
              .from('tasks')
              .select('*')
              .eq('user_id', user?.id)
              .order('position', { ascending: true, nullsFirst: false })
              .order('created_at', { ascending: false });
            
            if (!fetchError && allTasks) {
              const { organizeTasksWithSubtasks } = await import('../../utils/taskUtils');
              const organizedTasks = organizeTasksWithSubtasks(allTasks);
              setTasks(organizedTasks);
            }
          }
        }
      }
    } else {
      setSaving(false);
    }
  };

  // Add subtask to a parent task
  const addSubtask = async (parentId: string, text: string) => {
    if (!text.trim() || !user) return;
    setSaving(true);
    
    // Get parent task to find max position of its subtasks
    const parent = tasks.find(t => t.id === parentId);
    const parentSubtasks = parent?.subtasks || [];
    const maxPosition = parentSubtasks.length > 0
      ? Math.max(...parentSubtasks.map(st => st.position || 0))
      : 0;
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        text: text.trim(),
        completed: false,
        parent_id: parentId,
        position: maxPosition + 1,
      })
      .select();
    setSaving(false);
    
    if (!error && data && data[0]) {
      const newSubtask = data[0];
      // Refresh tasks to get organized hierarchy
      const { data: allTasks, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      
      if (!fetchError && allTasks) {
        const { organizeTasksWithSubtasks } = await import('../../utils/taskUtils');
        const organizedTasks = organizeTasksWithSubtasks(allTasks);
        setTasks(organizedTasks);
        // Auto-expand parent if not already expanded
        if (!expandedTasks.has(parentId)) {
          setExpandedTasks(prev => {
            const newSet = new Set(prev);
            newSet.add(parentId);
            localStorage.setItem('expandedTasks', JSON.stringify(Array.from(newSet)));
            return newSet;
          });
        }
      }
      setSubtaskInput('');
      setAddingSubtaskTo(null);
    }
  };

  // Toggle expand/collapse for tasks with subtasks
  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      localStorage.setItem('expandedTasks', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  // Delete task (cascades to subtasks via database)
  const deleteTask = async (id: string) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    setSaving(false);
    if (!error) {
      // Refresh all tasks to get organized hierarchy (subtasks will be deleted by cascade)
      const { data: allTasks, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      
      if (!fetchError && allTasks) {
        const { organizeTasksWithSubtasks } = await import('../../utils/taskUtils');
        const organizedTasks = organizeTasksWithSubtasks(allTasks);
        setTasks(organizedTasks);
      }
      setConfirmDeleteTaskId(null);
    }
  };

  // Drag and drop handlers for task reordering
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    // Only allow dragging from the grip handle or task container, not from interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button') || target.closest('input')) {
      e.preventDefault();
      return;
    }
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', taskId);
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTaskId && draggedTaskId !== taskId) {
      setDragOverTaskId(taskId);
      setDragOverSection(null);
    }
  };

  const handleDragLeave = () => {
    setDragOverTaskId(null);
    setDragOverSection(null);
  };

  const handleSectionDragOver = (e: React.DragEvent, sectionKey: 'today' | 'this_week' | 'this_month') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTaskId) {
      setDragOverSection(sectionKey);
      setDragOverTaskId(null);
      // Auto-expand section when dragging over it
      const sectionKeyMap = {
        'today': 'today' as const,
        'this_week': 'thisWeek' as const,
        'this_month': 'thisMonth' as const,
      };
      const expandedKey = sectionKeyMap[sectionKey];
      if (!expandedSections[expandedKey]) {
        setExpandedSections(prev => ({ ...prev, [expandedKey]: true }));
      }
    }
  };

  const handleSectionDragLeave = () => {
    setDragOverSection(null);
  };

  const handleDrop = async (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    setDragOverTaskId(null);
    setDragOverSection(null);
    
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null);
      return;
    }

    const draggedTask = tasks.find(t => t.id === draggedTaskId);
    const targetTask = tasks.find(t => t.id === targetTaskId);
    
    if (!draggedTask || !targetTask) {
      setDraggedTaskId(null);
      return;
    }

    // Create new array with reordered tasks
    const taskList = [...tasks];
    const draggedIndex = taskList.findIndex(t => t.id === draggedTaskId);
    const targetIndex = taskList.findIndex(t => t.id === targetTaskId);
    
    // Remove dragged task from its current position
    taskList.splice(draggedIndex, 1);
    // Insert at target position
    taskList.splice(targetIndex, 0, draggedTask);
    
    // Update positions for all tasks
    const updatedTasks = taskList.map((task, index) => ({
      ...task,
      position: index + 1
    }));
    
    // Optimistically update UI
    setTasks(updatedTasks);
    setDraggedTaskId(null);
    
    // Save positions to database
    setSaving(true);
    try {
      // Update all positions in batch
      const updates = updatedTasks.map(task => 
        supabase
          .from('tasks')
          .update({ position: task.position })
          .eq('id', task.id)
      );
      
      await Promise.all(updates);
    } catch (error) {
      // If update fails, revert to original order
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (!fetchError && data) {
        const { organizeTasksWithSubtasks } = await import('../../utils/taskUtils');
        const organizedTasks = organizeTasksWithSubtasks(data);
        setTasks(organizedTasks);
      }
    }
    setSaving(false);
  };

  const handleSectionDrop = async (e: React.DragEvent, targetSection: 'today' | 'this_week' | 'this_month') => {
    e.preventDefault();
    setDragOverSection(null);
    setDragOverTaskId(null);
    
    if (!draggedTaskId) {
      setDraggedTaskId(null);
      return;
    }

    const draggedTask = tasks.find(t => t.id === draggedTaskId);
    if (!draggedTask) {
      setDraggedTaskId(null);
      return;
    }

    // Check if task is already in this section
    const currentSection = getTaskSection(draggedTask);
    if (currentSection === targetSection) {
      setDraggedTaskId(null);
      return;
    }

    // Update section_override
    const sectionMap = {
      'today': 'today' as const,
      'this_week': 'this_week' as const,
      'this_month': 'this_month' as const,
    };
    
    const newSectionOverride = sectionMap[targetSection];
    
    // Optimistically update UI
    setTasks(tasks.map(t => 
      t.id === draggedTaskId 
        ? { ...t, section_override: newSectionOverride }
        : t
    ));
    setDraggedTaskId(null);
    
    // Save to database
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ section_override: newSectionOverride })
        .eq('id', draggedTaskId);
      
      if (error) {
        // Revert on error
        const { data, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user?.id)
          .order('position', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
        if (!fetchError && data) {
          const { organizeTasksWithSubtasks } = await import('../../utils/taskUtils');
          const organizedTasks = organizeTasksWithSubtasks(data);
          setTasks(organizedTasks);
        }
      }
    } catch (error) {
      // Revert on error
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (!fetchError && data) {
        const { organizeTasksWithSubtasks } = await import('../../utils/taskUtils');
        const organizedTasks = organizeTasksWithSubtasks(data);
        setTasks(organizedTasks);
      }
    }
    setSaving(false);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDragOverSection(null);
  };

  // Auto-focus input field when it appears
  useEffect(() => {
    if (showAddTaskInput && addTaskInputRef.current) {
      // Small delay to ensure the animation has started
      const timer = setTimeout(() => {
        addTaskInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showAddTaskInput]);

  // Helper to get duration for a task (per-task or fallback to default)
  const getTaskDuration = (taskId: string): number => {
    return taskPomodoroDurations[taskId] || pomodoroDuration;
  };

  // Helper to determine which section a task belongs to
  const getTaskSection = (task: Task): 'today' | 'this_week' | 'this_month' => {
    // If section_override is set, use it
    if (task.section_override) {
      return task.section_override;
    }
    
    // Otherwise, determine by created_at date
    const taskDate = new Date(task.created_at);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    
    // Get start of week (Monday)
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    // Get start of month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (taskDay.getTime() === today.getTime()) {
      return 'today';
    } else if (taskDate >= weekStart && taskDate < today) {
      return 'this_week';
    } else if (taskDate >= monthStart && taskDate < weekStart) {
      return 'this_month';
    } else {
      // Older than this month, default to this_month
      return 'this_month';
    }
  };

  // Group tasks by section (only parent tasks, subtasks are shown under their parents)
  const groupTasksBySection = (tasks: Task[]) => {
    const grouped = {
      today: [] as Task[],
      this_week: [] as Task[],
      this_month: [] as Task[],
    };
    
    // Filter tasks based on selected filter
    let filteredTasks = tasks;
    if (taskFilter === 'parent-only') {
      // Only show tasks that have subtasks
      filteredTasks = tasks.filter(task => !task.parent_id && task.has_subtasks && task.subtasks && task.subtasks.length > 0);
    } else if (taskFilter === 'standalone-only') {
      // Only show tasks without subtasks
      filteredTasks = tasks.filter(task => !task.parent_id && (!task.has_subtasks || !task.subtasks || task.subtasks.length === 0));
    } else {
      // 'all' - show all parent tasks (default behavior)
      filteredTasks = tasks.filter(task => !task.parent_id);
    }
    
    // Group filtered parent tasks
    filteredTasks.forEach(task => {
      const section = getTaskSection(task);
      grouped[section].push(task);
    });
    
    // Sort tasks within each section
    const sortTasks = (taskList: Task[]) => {
      return taskList.sort((a, b) => {
        // Sort by unfinished first
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Within same completion status, sort by position
        const aPos = a.position || 0;
        const bPos = b.position || 0;
        if (aPos !== bPos) {
          return aPos - bPos;
        }
        // Fallback to created_at
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    };
    
    return {
      today: sortTasks(grouped.today),
      this_week: sortTasks(grouped.this_week),
      this_month: sortTasks(grouped.this_month),
    };
  };

  // Group tasks by parent (for parent-based view)
  const groupTasksByParent = (tasks: Task[]) => {
    // Filter tasks based on selected filter
    let filteredTasks = tasks;
    if (taskFilter === 'parent-only') {
      filteredTasks = tasks.filter(task => !task.parent_id && task.has_subtasks && task.subtasks && task.subtasks.length > 0);
    } else if (taskFilter === 'standalone-only') {
      filteredTasks = tasks.filter(task => !task.parent_id && (!task.has_subtasks || !task.subtasks || task.subtasks.length === 0));
    } else {
      filteredTasks = tasks.filter(task => !task.parent_id);
    }
    
    // Sort tasks
    const sortTasks = (taskList: Task[]) => {
      return taskList.sort((a, b) => {
        // Sort by unfinished first
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Within same completion status, sort by position
        const aPos = a.position || 0;
        const bPos = b.position || 0;
        if (aPos !== bPos) {
          return aPos - bPos;
        }
        // Fallback to created_at
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    };
    
    return sortTasks(filteredTasks);
  };

  // Reset section override (return to date-based grouping)
  const resetSectionOverride = async (taskId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ section_override: null })
        .eq('id', taskId);
      
      if (!error) {
        setTasks(tasks.map(t => 
          t.id === taskId 
            ? { ...t, section_override: null }
            : t
        ));
      }
    } catch (error) {
      console.error('Error resetting section override:', error);
    } finally {
      setSaving(false);
    }
  };

  // Global reset function - reset all tasks' section_override
  const resetAllSectionOverrides = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      // Get all tasks with section_override set
      const tasksWithOverride = tasks.filter(t => t.section_override !== null);
      if (tasksWithOverride.length === 0) return;

      // Update all tasks with section_override
      const taskIds = tasksWithOverride.map(t => t.id);
      const { error } = await supabase
        .from('tasks')
        .update({ section_override: null })
        .in('id', taskIds);
      
      if (!error) {
        setTasks(tasks.map(t => ({ ...t, section_override: null })));
      }
    } catch (error) {
      console.error('Error resetting all section overrides:', error);
    } finally {
      setSaving(false);
    }
  };

  // Helper to save timer state to localStorage
  const saveTimerState = (timer: typeof pomodoroTimer) => {
    if (timer) {
      localStorage.setItem('pomodoroTimerState', JSON.stringify(timer));
    } else {
      localStorage.removeItem('pomodoroTimerState');
    }
  };

  // Effect to persist timer state to localStorage whenever it changes
  useEffect(() => {
    saveTimerState(pomodoroTimer);
  }, [pomodoroTimer]);

  // Pomodoro functions
  const startPomodoro = (taskId: string) => {
    const durationInSeconds = getTaskDuration(taskId) * 60;
    const endTime = Date.now() + (durationInSeconds * 1000);
    // Reset completion guard for new timer
    completionProcessedRef.current = { taskId, processed: false };
    // If there's already a timer running for a different task, stop it first
    if (pomodoroTimer && pomodoroTimer.taskId !== taskId) {
      // If starting a new task, stop the old timer completely
      setPomodoroTimer({
        taskId,
        timeRemaining: durationInSeconds,
        isRunning: true,
        endTime,
      });
    } else {
      // Same task - just start/reset
      setPomodoroTimer({
        taskId,
        timeRemaining: durationInSeconds,
        isRunning: true,
        endTime,
      });
    }
  };

  const pausePomodoro = () => {
    if (pomodoroTimer && pomodoroTimer.isRunning && pomodoroTimer.endTime) {
      // Calculate current timeRemaining from endTime before pausing
      const now = Date.now();
      const timeRemaining = Math.max(0, Math.floor((pomodoroTimer.endTime - now) / 1000));
      // Create updated timer state
      const updatedTimer = { ...pomodoroTimer, isRunning: false, endTime: null, timeRemaining };
      // Update React state
      setPomodoroTimer(updatedTimer);
      // Save to localStorage immediately (before useEffect runs) to ensure button condition reads correct value
      localStorage.setItem('pomodoroTimerState', JSON.stringify(updatedTimer));
      // Dispatch event to sync with PomodoroTimerBar
      window.dispatchEvent(new CustomEvent('pomodoroTimerStateChange'));
    }
  };

  const resumePomodoro = () => {
    if (pomodoroTimer && !pomodoroTimer.isRunning && pomodoroTimer.timeRemaining > 0) {
      // Recalculate endTime based on current timeRemaining
      const endTime = Date.now() + (pomodoroTimer.timeRemaining * 1000);
      // Create updated timer state
      const updatedTimer = { ...pomodoroTimer, isRunning: true, endTime };
      // Update React state
      setPomodoroTimer(updatedTimer);
      // Save to localStorage immediately (before useEffect runs) to ensure button condition reads correct value
      localStorage.setItem('pomodoroTimerState', JSON.stringify(updatedTimer));
      // Dispatch event to sync with PomodoroTimerBar
      window.dispatchEvent(new CustomEvent('pomodoroTimerStateChange'));
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
        endTime: null,
      });
    }
  };

  const stopPomodoro = () => {
    // Reset completion guard when stopping timer
    completionProcessedRef.current = { taskId: null, processed: false };
    // Remove from localStorage and sync with PomodoroTimerBar
    localStorage.removeItem('pomodoroTimerState');
    setPomodoroTimer(null);
    // Dispatch event to notify PomodoroTimerBar
    window.dispatchEvent(new CustomEvent('pomodoroTimerStateChange'));
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
        endTime: null,
      });
    } else if (pomodoroTimer) {
      // Timer exists but paused - just update duration
      setPomodoroTimer({
        ...pomodoroTimer,
        timeRemaining: minutes * 60,
        endTime: null,
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
          endTime: null,
        });
      } else if (pomodoroTimer) {
        // Timer exists but paused - just update duration
        setPomodoroTimer({
          ...pomodoroTimer,
          timeRemaining: minutes * 60,
          endTime: null,
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
          endTime: null,
        });
      } else {
        setPomodoroTimer({
          ...pomodoroTimer,
          timeRemaining: minutes * 60,
          endTime: null,
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
            endTime: null,
          });
        } else {
          setPomodoroTimer({
            ...pomodoroTimer,
            timeRemaining: minutes * 60,
            endTime: null,
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
          endTime: null,
        });
      } else {
        setPomodoroTimer({
          ...pomodoroTimer,
          timeRemaining: pomodoroDuration * 60,
          endTime: null,
        });
      }
    }
    
    setEditingTaskDuration(null);
  };

  // Listen for timer state changes from PomodoroTimerBar
  useEffect(() => {
    const handleTimerStateChange = () => {
      const saved = localStorage.getItem('pomodoroTimerState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.endTime && parsed.isRunning) {
            const now = Date.now();
            const timeRemaining = Math.max(0, Math.floor((parsed.endTime - now) / 1000));
            if (timeRemaining <= 0) {
              setPomodoroTimer(null);
              return;
            }
            setPomodoroTimer({ ...parsed, timeRemaining });
          } else {
            setPomodoroTimer(parsed);
          }
        } catch (e) {
          // Error handling
        }
      } else {
        setPomodoroTimer(null);
      }
    };
    
    window.addEventListener('pomodoroTimerStateChange', handleTimerStateChange);
    return () => {
      window.removeEventListener('pomodoroTimerStateChange', handleTimerStateChange);
    };
  }, []);

  // Timer countdown effect - Date-based calculation for accuracy
  useEffect(() => {
    if (!pomodoroTimer || !pomodoroTimer.isRunning || !pomodoroTimer.endTime) return;

    // Initialize guard if not already set for this timer
    if (pomodoroTimer.taskId && 
        (completionProcessedRef.current.taskId !== pomodoroTimer.taskId || 
         completionProcessedRef.current.processed)) {
      completionProcessedRef.current = { taskId: pomodoroTimer.taskId, processed: false };
    }

    const interval = setInterval(() => {
      setPomodoroTimer(prev => {
        if (!prev || !prev.isRunning || !prev.endTime) return prev;
        
        // Calculate time remaining from endTime (more accurate than decrementing)
        const now = Date.now();
        const timeRemaining = Math.max(0, Math.floor((prev.endTime - now) / 1000));
        
        if (timeRemaining <= 0) {
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
            const task = findTaskById(taskId);
            const taskName = task?.text || 'Task';
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Pomodoro Complete! 🍅', {
                body: `Great work on "${taskName}"! Take a short break.`,
                icon: '/favicon.ico',
              });
            }
          }
          
          return { ...prev, timeRemaining: 0, isRunning: false, endTime: null };
        }
        
        return { ...prev, timeRemaining };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pomodoroTimer?.isRunning, pomodoroTimer?.endTime, tasks]);

  // Force re-render every second when timer is running (for sync with PomodoroTimerBar)
  // Also re-render when timer state changes (pause/resume) to sync with PomodoroTimerBar
  useEffect(() => {
    if (!pomodoroTimer) return;
    
    // When running, update every second
    if (pomodoroTimer.isRunning && pomodoroTimer.endTime) {
      const interval = setInterval(() => {
        setTick(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // When paused, trigger one update to sync display
      setTick(prev => prev + 1);
    }
  }, [pomodoroTimer?.isRunning, pomodoroTimer?.endTime, pomodoroTimer?.timeRemaining]);

  // Sync showAllTasks state with localStorage for PomodoroTimerBar
  useEffect(() => {
    localStorage.setItem('showAllTasksModal', showAllTasks ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('pomodoroModalStateChange'));
  }, [showAllTasks]);

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
    }
  };

  // Helper to render a single task item
  const renderTaskItem = (task: Task, isSubtask: boolean = false) => {
    const hasSubtasks = task.has_subtasks && task.subtasks && task.subtasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const isAddingSubtask = addingSubtaskTo === task.id;
    
    return (
      <div key={task.id} className={isSubtask ? 'ml-3 sm:ml-4 md:ml-6' : ''}>
        <div 
          onDragOver={(e) => !isSubtask && handleDragOver(e, task.id)}
          onDragLeave={!isSubtask ? handleDragLeave : undefined}
          onDrop={(e) => !isSubtask && handleDrop(e, task.id)}
          onDragEnd={!isSubtask ? handleDragEnd : undefined}
          className={`bg-blue-50 dark:bg-blue-900/20 rounded p-1.5 sm:p-2 flex items-center gap-1 sm:gap-2 transition-all duration-500 ${
            completedTaskId === task.id 
              ? 'ring-2 ring-green-400 dark:ring-green-500 bg-green-100 dark:bg-green-900/40 shadow-lg' 
              : ''
          } ${
            draggedTaskId === task.id ? 'opacity-50' : ''
          } ${
            dragOverTaskId === task.id ? 'ring-2 ring-blue-400 dark:ring-blue-500 bg-blue-100 dark:bg-blue-900/40' : ''
          } ${isSubtask ? 'border-l-2 border-blue-300 dark:border-blue-700 pl-2 sm:pl-3' : ''}`}
        >
          {confirmDeleteTaskId === task.id ? (
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm text-red-600">Delete this task?</span>
              <button className="px-2 py-1 text-xs bg-red-500 text-white rounded" onClick={() => deleteTask(task.id)} disabled={saving}>Delete</button>
              <button className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded" onClick={() => setConfirmDeleteTaskId(null)} disabled={saving}>Cancel</button>
            </div>
          ) : <>
          {/* Expand/Collapse Button - show for ALL parent tasks (not just ones with subtasks) */}
          {!isSubtask ? (
            <button
              onClick={() => toggleExpand(task.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-transform p-0.5 sm:p-1"
              title={isExpanded ? 'Collapse subtasks' : 'Expand to add subtasks'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
          ) : null}
          {/* Drag Handle - only for parent tasks */}
          {!isSubtask && (
            <div 
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 p-0.5 sm:p-1"
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                handleDragStart(e, task.id);
              }}
            >
              <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          )}
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleTask(task.id, task.completed)}
            className="mr-2 flex-shrink-0"
            disabled={saving}
            draggable={false}
          />
          <input
            className={`flex-1 bg-transparent border-none focus:outline-none text-xs sm:text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}
            value={task.text}
            onChange={e => editTask(task.id, e.target.value)}
            disabled={saving}
            draggable={false}
          />
          {/* Progress Badge for tasks with subtasks */}
          {hasSubtasks && !isSubtask && (
            <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex-shrink-0">
              {task.completed_subtasks_count || 0}/{task.total_subtasks_count || 0}
            </span>
          )}
      {/* Pomodoro Controls */}
      <div className="flex items-center gap-1" draggable={false}>
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
        {/* Pomodoro Count Badge */}
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
              {(() => {
                // Read from localStorage to ensure sync with PomodoroTimerBar
                const saved = localStorage.getItem('pomodoroTimerState');
                if (saved) {
                  try {
                    const parsed = JSON.parse(saved);
                    // Calculate time remaining from endTime in real-time when running
                    if (parsed.endTime && parsed.isRunning && parsed.taskId === task.id) {
                      const now = Date.now();
                      const timeRemaining = Math.max(0, Math.floor((parsed.endTime - now) / 1000));
                      return formatTime(timeRemaining);
                    }
                    // When paused, use stored timeRemaining from localStorage (matches PomodoroTimerBar)
                    if (!parsed.isRunning && parsed.taskId === task.id) {
                      return formatTime(parsed.timeRemaining || 0);
                    }
                  } catch (e) {
                    // Fallback to React state if localStorage parse fails
                  }
                }
                // Fallback: Calculate from React state
                if (pomodoroTimer.endTime && pomodoroTimer.isRunning) {
                  const now = Date.now();
                  const timeRemaining = Math.max(0, Math.floor((pomodoroTimer.endTime - now) / 1000));
                  return formatTime(timeRemaining);
                }
                return formatTime(pomodoroTimer.timeRemaining);
              })()}
            </span>
            {(() => {
              // Check localStorage to determine if timer is running (same source as display)
              const saved = localStorage.getItem('pomodoroTimerState');
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  if (parsed.taskId === task.id) {
                    return parsed.isRunning;
                  }
                } catch (e) {
                  // Fallback to React state
                }
              }
              // Fallback to React state
              return pomodoroTimer.isRunning;
            })() ? (
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
        {/* Subtasks section - shown when expanded */}
        {!isSubtask && isExpanded && (
          <div className="mt-1 sm:mt-1.5 space-y-1">
            {/* Show existing subtasks */}
            {hasSubtasks && task.subtasks?.map(subtask => renderTaskItem(subtask, true))}
            {/* Add Subtask Input - show when adding or when no subtasks exist */}
            {isAddingSubtask ? (
              <div className="ml-3 sm:ml-4 md:ml-6 pl-2 sm:pl-3 border-l-2 border-blue-300 dark:border-blue-700 flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-blue-100/50 dark:bg-blue-900/10 rounded">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={e => setSubtaskInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && subtaskInput.trim()) {
                      addSubtask(task.id, subtaskInput);
                    } else if (e.key === 'Escape') {
                      setAddingSubtaskTo(null);
                      setSubtaskInput('');
                    }
                  }}
                  className="flex-1 bg-transparent border-none focus:outline-none text-xs sm:text-sm text-gray-900 dark:text-white"
                  placeholder="Add subtask..."
                  autoFocus
                  disabled={saving}
                />
                <button
                  onClick={() => {
                    if (subtaskInput.trim()) {
                      addSubtask(task.id, subtaskInput);
                    } else {
                      setAddingSubtaskTo(null);
                      setSubtaskInput('');
                    }
                  }}
                  className="p-0.5 sm:p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 flex-shrink-0"
                  disabled={saving}
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => {
                    setAddingSubtaskTo(null);
                    setSubtaskInput('');
                  }}
                  className="p-0.5 sm:p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                  disabled={saving}
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAddingSubtaskTo(task.id);
                  setSubtaskInput('');
                }}
                className="ml-3 sm:ml-4 md:ml-6 pl-2 sm:pl-3 text-[10px] sm:text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 p-0.5 sm:p-1"
                disabled={saving}
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Add subtask</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // In the tasks widget, only show first 3 parent tasks (subtasks are shown under their parents), and a 'View All Tasks' link if more
  // Apply filter if set
  const filteredTasksForPreview = (() => {
    let filtered = tasks.filter(t => !t.parent_id);
    if (taskFilter === 'parent-only') {
      filtered = filtered.filter(task => task.has_subtasks && task.subtasks && task.subtasks.length > 0);
    } else if (taskFilter === 'standalone-only') {
      filtered = filtered.filter(task => !task.has_subtasks || !task.subtasks || task.subtasks.length === 0);
    }
    return filtered;
  })();
  const tasksToShow = filteredTasksForPreview.slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-blue-900/40 rounded-xl p-4 shadow-sm flex flex-col transition-all duration-300">
      {/* Widget Header */}
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Tasks</h3>
      </div>
      {/* Quick Add Task Input - Always visible in collapsed view */}
      <div className="mb-3">
        <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg p-2 flex items-center gap-2 shadow-sm">
          <input
            ref={addTaskInputRef}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="Add a task..."
            value={todoInput}
            onChange={e => setTodoInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && todoInput.trim()) {
                e.preventDefault();
                addTask();
              }
            }}
            disabled={saving}
          />
          <button
            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex-shrink-0 disabled:opacity-50"
            onClick={(e) => {
              e.preventDefault();
              if (todoInput.trim()) {
                addTask();
              }
            }}
            disabled={saving || !todoInput.trim()}
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Tasks List (show only first 3) */}
      <div className="space-y-2">
        {tasksToShow.length === 0 && <div className="text-gray-400 text-sm text-center">No tasks yet.</div>}
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
      {/* All Tasks Modal */}
      <Modal
        isOpen={showAllTasks}
        onRequestClose={() => {
          setShowAllTasks(false);
          setShowPomodoroSettings(false);
          setEditingTaskDuration(null);
          setShowAddTaskInput(false);
        }}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-md z-40"
        ariaHideApp={false}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-lg relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Tasks</h2>
            <div className="flex items-center gap-1">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded p-0.5">
                <button
                  onClick={() => setViewMode('time-based')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === 'time-based'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Time-based view"
                >
                  Time
                </button>
                <button
                  onClick={() => setViewMode('parent-based')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === 'parent-based'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Parent-based view"
                >
                  Parent
                </button>
              </div>
              <button
                onClick={() => setShowAddTaskInput(!showAddTaskInput)}
                className={`p-1.5 transition-colors ${
                  showAddTaskInput 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title={showAddTaskInput ? "Hide add task" : "Add new task"}
              >
                <Plus className="w-4 h-4" />
              </button>
              {/* Reset All Section Overrides - only show if any task has section_override */}
              {tasks.some(t => t.section_override !== null) && (
                <button
                  onClick={resetAllSectionOverrides}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (!saving) {
                      resetAllSectionOverrides();
                    }
                  }}
                  disabled={saving}
                  className="p-1.5 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors touch-manipulation"
                  title="Reset all tasks to date-based grouping"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              {/* Pomodoro Settings */}
              <div className="relative pomodoro-settings-container">
                <button
                  onClick={openSettings}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
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
            <button 
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" 
              onClick={() => setShowAllTasks(false)}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
            </div>
          </div>
          {/* Add Task Input - Toggleable */}
          <div className={`mb-2 overflow-hidden transition-all duration-300 ease-in-out ${
            showAddTaskInput ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2 flex items-center gap-2 shadow-sm transform transition-all duration-300 ${
              showAddTaskInput ? 'translate-y-0' : '-translate-y-2'
            }`}>
              <input
                ref={addTaskInputRef}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Add a task..."
                value={todoInput}
                onChange={e => setTodoInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    addTask();
                    setTodoInput('');
                  }
                }}
                disabled={saving}
              />
              <button
                className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex-shrink-0"
                onClick={() => {
                  addTask();
                  setTodoInput('');
                }}
                disabled={saving}
                title="Add task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Accordion Sections or Parent-based View */}
          {viewMode === 'time-based' ? (
            (() => {
              const groupedTasks = groupTasksBySection(tasks);
              const sections = [
                { key: 'today' as const, label: 'Today', tasks: groupedTasks.today },
                { key: 'thisWeek' as const, label: 'This Week', tasks: groupedTasks.this_week },
                { key: 'thisMonth' as const, label: 'This Month', tasks: groupedTasks.this_month },
              ];
              
              return (
                <div className="space-y-3">
                  {sections.map(({ key, label, tasks: sectionTasks }) => {
                    const isExpanded = expandedSections[key];
                    const sectionMap = {
                      today: 'today' as const,
                      thisWeek: 'this_week' as const,
                      thisMonth: 'this_month' as const,
                    };
                    const sectionKey = sectionMap[key];
                    const isDragOver = dragOverSection === sectionKey;
                    
                    return (
                      <div 
                        key={key} 
                        className={`rounded-lg overflow-hidden transition-all ${
                          isDragOver 
                            ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40' 
                            : ''
                        }`}
                        onDragOver={(e) => handleSectionDragOver(e, sectionKey)}
                        onDragLeave={handleSectionDragLeave}
                        onDrop={(e) => handleSectionDrop(e, sectionKey)}
                      >
                        {/* Section Header */}
                        <button
                          onClick={() => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))}
                          className="w-full flex items-center justify-between transition-colors"
                          style={{ background: 'unset', padding: 0 }}
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                            <span className="font-semibold text-gray-900 dark:text-white">{label}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">({sectionTasks.length})</span>
                          </div>
                        </button>
                        
                        {/* Section Content */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="py-[5px] px-0 space-y-2">
                            {sectionTasks.length === 0 ? (
                              <div 
                                className={`text-center py-4 text-sm transition-colors ${
                                  isDragOver 
                                    ? 'text-gradient-primary font-medium' 
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}
                              >
                                {isDragOver ? 'Drop task here' : 'No tasks'}
                              </div>
                            ) : (
                              sectionTasks.map(task => renderTaskItem(task))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
              })()
            ) : (
              // Parent-based view
              <div className="space-y-2">
                {(() => {
                  const parentTasks = groupTasksByParent(tasks);
                  if (parentTasks.length === 0) {
                    return <div className="text-gray-400 text-sm text-center py-4">No tasks found.</div>;
                  }
                  return parentTasks.map(task => renderTaskItem(task));
                })()}
              </div>
            )}
        </div>
      </Modal>
    </div>
  );
};
