import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Flame, Calendar, List, Grid3x3, Columns } from 'lucide-react';
import { useClientStore } from '../../store/useClientStore';
import { Task } from '../../types/client';
import { StatCard } from './StatCard';
import { SortableTaskItem } from './SortableTaskItem';
import { TaskItem } from './TaskItem';
import { KanbanColumn } from './KanbanColumn';
import { TaskForm } from '../Tasks/TaskForm';
import { getTodayNormalized, normalizeTaskDate, isTaskOverdue, isTaskDueToday, isTaskDueThisWeek } from '../../utils/taskDateUtils';
import { showToast } from '../../lib/toast';
import { useTouchDevice } from '../../hooks/useTouchDevice';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export const ClientTasksWidget: React.FC = () => {
  console.log('🚀 ClientTasksWidget component rendered');
  const { tasks, clients, fetchTasks, fetchClients, updateTask, updateTaskPositions, deleteTask, error, tasksLoading } = useClientStore();
  console.log('📊 ClientTasksWidget initial state:', {
    tasksCount: tasks.length,
    tasksLoading,
    error,
    tasks: tasks.map(t => ({ id: t.id, status: t.status, title: t.title }))
  });
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
  const [activeTab, setActiveTab] = useState<'in_progress' | 'waiting_on_client' | 'waiting_on_me'>('in_progress');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('clientTasksViewMode');
    return (saved === 'list' || saved === 'grid' || saved === 'kanban') ? saved : 'list';
  });
  const [isDraggingTask, setIsDraggingTask] = useState<string | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[] | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const isTouchDevice = useTouchDevice();
  const { isMobile } = useMobileDetection();
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTasks();
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save view mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('clientTasksViewMode', viewMode);
  }, [viewMode]);

  // Close status menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use optimistic tasks if available, otherwise use store tasks
  const displayTasks = optimisticTasks || tasks;
  
  // Filter out completed tasks
  const allActiveTasks = displayTasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
  console.log('📋 ClientTasksWidget - Active tasks:', {
    displayTasksCount: displayTasks.length,
    allActiveTasksCount: allActiveTasks.length,
    allActiveTasks: allActiveTasks.map(t => ({ id: t.id, status: t.status, title: t.title }))
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const urgent = allActiveTasks.filter(t => t.priority === 'urgent').length;
    const overdue = allActiveTasks.filter(t => isTaskOverdue(t.due_date, t.status)).length;
    const dueToday = allActiveTasks.filter(t => isTaskDueToday(t.due_date, t.status)).length;
    const dueThisWeek = allActiveTasks.filter(t => isTaskDueThisWeek(t.due_date, t.status)).length;

    return {
      total: allActiveTasks.length,
      urgent,
      overdue,
      dueToday,
      dueThisWeek
    };
  }, [allActiveTasks]);

  // Group tasks by status for Kanban columns and sort by position
  const tasksByStatus = useMemo(() => {
    const grouped = {
      in_progress: allActiveTasks
        .filter(t => t.status === 'in_progress')
        .sort((a, b) => (a.position || 0) - (b.position || 0)),
      waiting_on_client: allActiveTasks
        .filter(t => t.status === 'waiting_on_client')
        .sort((a, b) => (a.position || 0) - (b.position || 0)),
      waiting_on_me: allActiveTasks
        .filter(t => t.status === 'waiting_on_me')
        .sort((a, b) => (a.position || 0) - (b.position || 0))
    };
    console.log('🔍 ClientTasksWidget - Tasks by Status:', {
      totalActiveTasks: allActiveTasks.length,
      in_progress: grouped.in_progress.length,
      waiting_on_client: grouped.waiting_on_client.length,
      waiting_on_me: grouped.waiting_on_me.length,
      allTaskStatuses: allActiveTasks.map(t => ({ id: t.id, status: t.status, title: t.title }))
    });
    return grouped;
  }, [allActiveTasks]);

  // Group tasks by priority for breakdown
  const tasksByPriority = useMemo(() => ({
    urgent: allActiveTasks.filter(t => t.priority === 'urgent'),
    high: allActiveTasks.filter(t => t.priority === 'high'),
    medium: allActiveTasks.filter(t => t.priority === 'medium'),
    low: allActiveTasks.filter(t => t.priority === 'low')
  }), [allActiveTasks]);

  // Drag and drop sensors
  // Use activationConstraint to distinguish between click (edit) and drag (reorder)
  // Drag only activates after moving 8px (desktop) or 12px (touch), preventing accidental drags on clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isTouchDevice ? 12 : 8, // Require more movement on touch devices
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end - supports both column-to-column and within-column reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setIsDraggingTask(null);
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find the task being dragged
    const task = allActiveTasks.find(t => t.id === taskId);
    if (!task) {
      setIsDraggingTask(null);
      return;
    }

    // Check if dragging within the same column (reordering) or to a different column (status change)
    const sourceColumnTasks = tasksByStatus[task.status as keyof typeof tasksByStatus] || [];
    const sourceColumnIndex = sourceColumnTasks.findIndex(t => t.id === taskId);
    
    // Check if overId is a task ID (within-column reorder) or column ID (column change)
    const isOverTask = allActiveTasks.some(t => t.id === overId);
    
    if (isOverTask && overId !== taskId) {
      // Within-column reordering: overId is another task in the same or different column
      const targetTask = allActiveTasks.find(t => t.id === overId);
      if (!targetTask) {
        setIsDraggingTask(null);
        return;
      }

      // If same status, reorder within column
      if (targetTask.status === task.status) {
        const columnTasks = [...tasksByStatus[task.status as keyof typeof tasksByStatus]];
        const targetIndex = columnTasks.findIndex(t => t.id === overId);
        
        // Use arrayMove to properly reorder
        const reorderedTasks = arrayMove(columnTasks, sourceColumnIndex, targetIndex);

        // Update positions for all tasks in the column
        const positionUpdates = reorderedTasks.map((t, index) => ({
          id: t.id,
          position: index + 1
        }));

        // Optimistic update - update positions for tasks in this column
        const optimisticUpdate = tasks.map(t => {
          const update = positionUpdates.find(u => u.id === t.id);
          return update ? { ...t, position: update.position } : t;
        });
        setOptimisticTasks(optimisticUpdate);

        try {
          await updateTaskPositions(positionUpdates);
          setOptimisticTasks(null);
        } catch (error) {
          console.error('Failed to update task positions:', error);
          setOptimisticTasks(null);
          showToast.error('Failed to reorder tasks. Please try again.');
          fetchTasks(); // Refresh on error
        } finally {
          setIsDraggingTask(null);
        }
        return;
      } else {
        // Different status - treat as column change
        const newStatus = targetTask.status;
        const targetColumnTasks = tasksByStatus[newStatus as keyof typeof tasksByStatus] || [];
        const newPosition = targetColumnTasks.length + 1;

        // Optimistic update
        const optimisticUpdate = tasks.map(t => 
          t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t
        );
        setOptimisticTasks(optimisticUpdate);

        try {
          await updateTask(taskId, { status: newStatus, position: newPosition });
          setOptimisticTasks(null);
        } catch (error) {
          console.error('Failed to update task:', error);
          setOptimisticTasks(null);
          showToast.error('Failed to move task. Please try again.');
        } finally {
          setIsDraggingTask(null);
        }
        return;
      }
    }

    // Column-to-column dragging (overId is a column ID)
    const targetColumnId = overId;
    let newStatus: Task['status'];
    if (targetColumnId === 'urgent') {
      newStatus = 'in_progress';
    } else {
      newStatus = targetColumnId as Task['status'];
    }

    if (task.status === newStatus) {
      setIsDraggingTask(null);
      return;
    }

    // Calculate new position (add to end of target column)
    const targetColumnTasks = tasksByStatus[newStatus as keyof typeof tasksByStatus] || [];
    const newPosition = targetColumnTasks.length + 1;

    // Optimistic update
    const optimisticUpdate = tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t
    );
    setOptimisticTasks(optimisticUpdate);
    setIsDraggingTask(taskId);

    // Update task status with error handling
    try {
      await updateTask(taskId, { status: newStatus, position: newPosition });
      setOptimisticTasks(null);
    } catch (error) {
      console.error('Failed to update task status:', error);
      setOptimisticTasks(null);
      showToast.error('Failed to move task. Please try again.');
    } finally {
      setIsDraggingTask(null);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'low':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'waiting_on_client':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'waiting_on_me':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    await updateTask(taskId, { status: newStatus });
    setStatusMenuOpen(null);
    // Switch to the appropriate tab if in list view and the new status is one of our active tabs
    if (viewMode === 'list' && (newStatus === 'in_progress' || newStatus === 'waiting_on_client' || newStatus === 'waiting_on_me')) {
      setActiveTab(newStatus);
    }
    // Note: fetchTasks() removed - updateTask already updates the store optimistically
  };

  const handleStatusClick = (taskId: string) => {
    setStatusMenuOpen(statusMenuOpen === taskId ? null : taskId);
  };

  const handleTaskClick = (task: Task) => {
    // Don't open edit modal if we're dragging
    if (isDraggingTask) return;
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    // Refresh tasks after editing
    fetchTasks();
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      showToast.success('Task deleted successfully');
      // Refresh tasks after deletion
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
      showToast.error('Failed to delete task. Please try again.');
    }
  };

  // Early returns - must be after all hooks
  // Show loading state while fetching initial data
  if (tasksLoading && tasks.length === 0 && !error) {
    console.log('⏳ ClientTasksWidget - Returning null (loading)');
    return null; // Don't show widget while loading initial data
  }

  if (allActiveTasks.length === 0) {
    console.log('❌ ClientTasksWidget - Returning null (no active tasks)', {
      tasksCount: tasks.length,
      allActiveTasksCount: allActiveTasks.length
    });
    return null; // Don't show widget if no active tasks
  }

  console.log('✅ ClientTasksWidget - Rendering widget');

  return (
    <div className="w-full max-w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-md sm:rounded-lg p-1 sm:p-1.5 md:p-2 shadow-sm transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 overflow-hidden">
      {/* Header */}
      <div 
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-1"
      >
        <div 
          className="flex items-center gap-1 sm:gap-1 flex-1 min-w-0 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h2 className="text-xs sm:text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">
            Client Tasks ({allActiveTasks.length})
          </h2>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 flex-shrink-0 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
            title={isExpanded ? 'Collapse' : 'Expand'}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 sm:w-4 sm:h-4" />
            ) : (
              <ChevronDown className="w-4 h-4 sm:w-4 sm:h-4" />
            )}
          </button>
        </div>

        {/* View Mode Toggle - Only show when expanded */}
        {isExpanded && (
          <div className="flex items-center gap-1 bg-white/50 dark:bg-gray-800/50 rounded-md p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('list');
              }}
              className={`p-1.5 sm:p-1.5 rounded transition-colors min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation ${
                viewMode === 'list'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="List view"
              aria-label="List view"
            >
              <List className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('grid');
              }}
              className={`p-1.5 sm:p-1.5 rounded transition-colors min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation ${
                viewMode === 'grid'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <Grid3x3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('kanban');
              }}
              className={`p-1.5 sm:p-1.5 rounded transition-colors min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation ${
                viewMode === 'kanban'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Kanban view"
              aria-label="Kanban view"
            >
              <Columns className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        )}
        
        {/* Collapsed State Indicators - Desktop (right side badges) */}
        {!isExpanded && (
          <div className="hidden md:flex items-center gap-0.5 flex-wrap">
            {stats.overdue > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 shadow-sm">
                <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden lg:inline">{stats.overdue} Overdue</span>
                <span className="lg:hidden">{stats.overdue}</span>
              </span>
            )}
            {stats.dueToday > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shadow-sm">
                <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden lg:inline">{stats.dueToday} Due Today</span>
                <span className="lg:hidden">{stats.dueToday}</span>
              </span>
            )}
            {stats.urgent > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm">
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden lg:inline">{stats.urgent} Urgent</span>
                <span className="lg:hidden">{stats.urgent}</span>
              </span>
            )}
            {stats.dueThisWeek > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm">
                <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden lg:inline">{stats.dueThisWeek} Due This Week</span>
                <span className="lg:hidden">{stats.dueThisWeek}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-1 p-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-[9px] sm:text-[10px] text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* Collapsed State Summary - Mobile (below title) */}
      {!isExpanded && (
        <div className="sm:hidden mt-0.5 text-[9px] text-gray-600 dark:text-gray-400">
          {stats.overdue > 0 || stats.dueToday > 0 || stats.urgent > 0 || stats.dueThisWeek > 0 ? (
            <div className="flex items-center gap-0.5 flex-wrap">
              {stats.overdue > 0 && (
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  {stats.overdue} overdue
                </span>
              )}
              {stats.dueToday > 0 && (
                <span className="text-orange-600 dark:text-orange-400 font-semibold">
                  {stats.dueToday} due today
                </span>
              )}
              {stats.urgent > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {stats.urgent} urgent
                </span>
              )}
              {stats.dueThisWeek > 0 && (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {stats.dueThisWeek} due this week
                </span>
              )}
            </div>
          ) : (
            <span>No urgent or overdue tasks</span>
          )}
        </div>
      )}

      {/* Content Views */}
      {isExpanded && (
        <div className="mt-1 sm:mt-1.5 max-w-full overflow-hidden">
          {/* List View - Tabbed Interface */}
          {viewMode === 'list' && (
            <>
              {/* Tab Navigation */}
              <div className="flex items-center gap-0.5 sm:gap-1 border-b border-gray-200 dark:border-gray-700 mb-1 sm:mb-1.5 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('in_progress')}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] md:text-xs font-medium transition-colors whitespace-nowrap border-b-2 ${
                    activeTab === 'in_progress'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  In Progress
                  {tasksByStatus.in_progress.length > 0 && (
                    <span className={`ml-1 px-1 py-0.5 rounded-full text-[8px] sm:text-[9px] ${
                      activeTab === 'in_progress'
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tasksByStatus.in_progress.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('waiting_on_client')}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] md:text-xs font-medium transition-colors whitespace-nowrap border-b-2 ${
                    activeTab === 'waiting_on_client'
                      ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/20'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Waiting on Client
                  {tasksByStatus.waiting_on_client.length > 0 && (
                    <span className={`ml-1 px-1 py-0.5 rounded-full text-[8px] sm:text-[9px] ${
                      activeTab === 'waiting_on_client'
                        ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tasksByStatus.waiting_on_client.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('waiting_on_me')}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] md:text-xs font-medium transition-colors whitespace-nowrap border-b-2 ${
                    activeTab === 'waiting_on_me'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Waiting on Me
                  {tasksByStatus.waiting_on_me.length > 0 && (
                    <span className={`ml-1 px-1 py-0.5 rounded-full text-[8px] sm:text-[9px] ${
                      activeTab === 'waiting_on_me'
                        ? 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tasksByStatus.waiting_on_me.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="overflow-y-auto min-h-[180px] sm:min-h-[160px] md:min-h-[140px] max-h-[calc(100vh-250px)] sm:max-h-[calc(100vh-280px)] md:max-h-[400px] lg:max-h-[450px]">
                <div className="space-y-1 sm:space-y-1.5 pr-0.5">
                  {tasksByStatus[activeTab].length > 0 ? (
                    tasksByStatus[activeTab].map((task) => {
                      const clientName = getClientName(task.client_id);
                      const isOverdue = isTaskOverdue(task.due_date, task.status);

                      return (
                        <TaskItem
                          key={task.id}
                          task={task}
                          clientName={clientName}
                          isOverdue={isOverdue}
                          getPriorityColor={getPriorityColor}
                          getStatusColor={getStatusColor}
                          statusMenuOpen={statusMenuOpen}
                          statusMenuRef={statusMenuRef}
                          onStatusClick={handleStatusClick}
                          onStatusChange={handleStatusChange}
                          onTaskClick={handleTaskClick}
                          onTaskDelete={handleTaskDelete}
                        />
                      );
                    })
                  ) : (
                    <div className="text-center py-4 sm:py-6 text-gray-400 dark:text-gray-500 text-[9px] sm:text-[10px] md:text-xs">
                      No tasks in this category
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="overflow-y-auto min-h-[180px] sm:min-h-[160px] md:min-h-[140px] max-h-[calc(100vh-250px)] sm:max-h-[calc(100vh-280px)] md:max-h-[400px] lg:max-h-[450px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2">
                {allActiveTasks.length > 0 ? (
                  allActiveTasks.map((task) => {
                    const clientName = getClientName(task.client_id);
                    const isOverdue = isTaskOverdue(task.due_date, task.status);

                    return (
                      <TaskItem
                        key={task.id}
                        task={task}
                        clientName={clientName}
                        isOverdue={isOverdue}
                        getPriorityColor={getPriorityColor}
                        getStatusColor={getStatusColor}
                        statusMenuOpen={statusMenuOpen}
                        statusMenuRef={statusMenuRef}
                        onStatusClick={handleStatusClick}
                        onStatusChange={handleStatusChange}
                        onTaskClick={handleTaskClick}
                        onTaskDelete={handleTaskDelete}
                      />
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-4 sm:py-6 text-gray-400 dark:text-gray-500 text-[9px] sm:text-[10px] md:text-xs">
                    No active tasks
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {/* Mobile: Vertical Stack Layout */}
              {isMobile ? (
                <div 
                  className="overflow-y-auto pb-2 pt-1 min-h-[360px] max-h-[calc(100vh-200px)]"
                  style={{ 
                    scrollbarWidth: 'thin',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain'
                  }}
                >
                  <div className="flex flex-col gap-2 w-full">
                    {/* In Progress Column */}
                    <KanbanColumn
                      id="in_progress"
                      title="In Progress"
                      tasks={tasksByStatus.in_progress}
                      getClientName={getClientName}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      statusMenuOpen={statusMenuOpen}
                      statusMenuRef={statusMenuRef}
                      onStatusClick={handleStatusClick}
                      onStatusChange={handleStatusChange}
                      onTaskClick={handleTaskClick}
                      onTaskDelete={handleTaskDelete}
                      color="bg-blue-50 dark:bg-blue-900/20"
                      isDraggingTask={isDraggingTask}
                    />

                    {/* Waiting on Client Column */}
                    <KanbanColumn
                      id="waiting_on_client"
                      title="Waiting on Client"
                      tasks={tasksByStatus.waiting_on_client}
                      getClientName={getClientName}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      statusMenuOpen={statusMenuOpen}
                      statusMenuRef={statusMenuRef}
                      onStatusClick={handleStatusClick}
                      onStatusChange={handleStatusChange}
                      onTaskClick={handleTaskClick}
                      onTaskDelete={handleTaskDelete}
                      color="bg-yellow-50 dark:bg-yellow-900/20"
                      isDraggingTask={isDraggingTask}
                    />

                    {/* Waiting on Me Column */}
                    <KanbanColumn
                      id="waiting_on_me"
                      title="Waiting on Me"
                      tasks={tasksByStatus.waiting_on_me}
                      getClientName={getClientName}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      statusMenuOpen={statusMenuOpen}
                      statusMenuRef={statusMenuRef}
                      onStatusClick={handleStatusClick}
                      onStatusChange={handleStatusChange}
                      onTaskClick={handleTaskClick}
                      onTaskDelete={handleTaskDelete}
                      color="bg-purple-50 dark:bg-purple-900/20"
                      isDraggingTask={isDraggingTask}
                    />
                  </div>
                </div>
              ) : (
                /* Tablet/Desktop: Horizontal Layout */
                <div 
                  className="overflow-x-auto overflow-y-auto pb-2 pt-1 sm:pt-1.5 md:pt-2 max-h-[calc(100vh-220px)] md:max-h-[500px] lg:max-h-[550px] xl:max-h-[600px] snap-x snap-mandatory"
                  style={{ 
                    scrollbarWidth: 'thin',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    touchAction: 'pan-x pan-y'
                  }}
                >
                  <div 
                    className="flex flex-row gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 w-max md:w-full"
                  >
                    {/* In Progress Column */}
                    <KanbanColumn
                      id="in_progress"
                      title="In Progress"
                      tasks={tasksByStatus.in_progress}
                      getClientName={getClientName}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      statusMenuOpen={statusMenuOpen}
                      statusMenuRef={statusMenuRef}
                      onStatusClick={handleStatusClick}
                      onStatusChange={handleStatusChange}
                      onTaskClick={handleTaskClick}
                      onTaskDelete={handleTaskDelete}
                      color="bg-blue-50 dark:bg-blue-900/20"
                      isDraggingTask={isDraggingTask}
                    />

                    {/* Waiting on Client Column */}
                    <KanbanColumn
                      id="waiting_on_client"
                      title="Waiting on Client"
                      tasks={tasksByStatus.waiting_on_client}
                      getClientName={getClientName}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      statusMenuOpen={statusMenuOpen}
                      statusMenuRef={statusMenuRef}
                      onStatusClick={handleStatusClick}
                      onStatusChange={handleStatusChange}
                      onTaskClick={handleTaskClick}
                      onTaskDelete={handleTaskDelete}
                      color="bg-yellow-50 dark:bg-yellow-900/20"
                      isDraggingTask={isDraggingTask}
                    />

                    {/* Waiting on Me Column */}
                    <KanbanColumn
                      id="waiting_on_me"
                      title="Waiting on Me"
                      tasks={tasksByStatus.waiting_on_me}
                      getClientName={getClientName}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      statusMenuOpen={statusMenuOpen}
                      statusMenuRef={statusMenuRef}
                      onStatusClick={handleStatusClick}
                      onStatusChange={handleStatusChange}
                      onTaskClick={handleTaskClick}
                      onTaskDelete={handleTaskDelete}
                      color="bg-purple-50 dark:bg-purple-900/20"
                      isDraggingTask={isDraggingTask}
                    />
                  </div>
                </div>
              )}
            </DndContext>
          )}
        </div>
      )}

      {/* Task Edit Modal */}
      {showTaskForm && (
        <TaskForm
          isOpen={showTaskForm}
          onClose={handleCloseTaskForm}
          task={editingTask}
        />
      )}
    </div>
  );
};

