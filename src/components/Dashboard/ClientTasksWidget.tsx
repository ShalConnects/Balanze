import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Flame, Calendar } from 'lucide-react';
import { useClientStore } from '../../store/useClientStore';
import { Task } from '../../types/client';
import { StatCard } from './StatCard';
import { KanbanColumn } from './KanbanColumn';
import { TaskForm } from '../Tasks/TaskForm';
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
} from '@dnd-kit/sortable';

export const ClientTasksWidget: React.FC = () => {
  const { tasks, clients, fetchTasks, fetchClients, updateTask, updateTaskPositions, deleteTask, error, tasksLoading } = useClientStore();
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
  const [isDraggingTask, setIsDraggingTask] = useState<string | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[] | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTasks();
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    // Normalize to start of day to avoid timezone issues
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const urgent = allActiveTasks.filter(t => t.priority === 'urgent').length;
    const overdue = allActiveTasks.filter(t => {
      if (!t.due_date) return false;
      // Normalize due_date to start of day for accurate comparison
      const dueDateStr = t.due_date.split('T')[0]; // Get YYYY-MM-DD part
      const [year, month, day] = dueDateStr.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day);
      return dueDate < today && t.status !== 'completed';
    }).length;
    const dueToday = allActiveTasks.filter(t => {
      if (!t.due_date) return false;
      // Normalize due_date to start of day for accurate comparison
      const dueDateStr = t.due_date.split('T')[0]; // Get YYYY-MM-DD part
      const [year, month, day] = dueDateStr.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day);
      return dueDate.getTime() === today.getTime() && t.status !== 'completed';
    }).length;
    const dueThisWeek = allActiveTasks.filter(t => {
      if (!t.due_date) return false;
      // Normalize due_date to start of day for accurate comparison
      const dueDateStr = t.due_date.split('T')[0]; // Get YYYY-MM-DD part
      const [year, month, day] = dueDateStr.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day);
      return dueDate >= tomorrow && dueDate <= nextWeek && t.status !== 'completed';
    }).length;

    return {
      total: allActiveTasks.length,
      urgent,
      overdue,
      dueToday,
      dueThisWeek
    };
  }, [allActiveTasks]);

  // Group tasks by status for Kanban columns and sort by position
  const tasksByStatus = useMemo(() => ({
    in_progress: allActiveTasks
      .filter(t => t.status === 'in_progress')
      .sort((a, b) => (a.position || 0) - (b.position || 0)),
    waiting_on_client: allActiveTasks
      .filter(t => t.status === 'waiting_on_client')
      .sort((a, b) => (a.position || 0) - (b.position || 0)),
    waiting_on_me: allActiveTasks
      .filter(t => t.status === 'waiting_on_me')
      .sort((a, b) => (a.position || 0) - (b.position || 0))
  }), [allActiveTasks]);

  // Group tasks by priority for breakdown
  const tasksByPriority = useMemo(() => ({
    urgent: allActiveTasks.filter(t => t.priority === 'urgent'),
    high: allActiveTasks.filter(t => t.priority === 'high'),
    medium: allActiveTasks.filter(t => t.priority === 'medium'),
    low: allActiveTasks.filter(t => t.priority === 'low')
  }), [allActiveTasks]);

  // Drag and drop sensors
  // Use activationConstraint to distinguish between click (edit) and drag (reorder)
  // Drag only activates after moving 8px, preventing accidental drags on clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag activates
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
      // Refresh tasks after deletion
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Early returns - must be after all hooks
  // Show loading state while fetching
  if (tasksLoading && tasks.length === 0) {
    return null; // Don't show widget while loading initial data
  }

  // Show loading state while fetching initial data (but show error if there is one)
  if (tasksLoading && tasks.length === 0 && !error) {
    return null; // Don't show widget while loading initial data
  }

  if (allActiveTasks.length === 0) {
    return null; // Don't show widget if no active tasks
  }

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg sm:rounded-xl p-1.5 sm:p-2 sm:p-3 lg:p-[0.7rem_1rem] shadow-sm transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700">
      {/* Header */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1 sm:gap-1.5 sm:gap-2 flex-1 min-w-0">
          <h2 className="text-sm sm:text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
            Client Tasks ({allActiveTasks.length})
          </h2>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400 flex-shrink-0"
            title={isExpanded ? 'Collapse' : 'Expand'}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
        
        {/* Collapsed State Indicators - Desktop (right side badges) */}
        {!isExpanded && (
          <div className="hidden md:flex items-center gap-1 sm:gap-1.5 sm:gap-2 flex-wrap">
            {stats.overdue > 0 && (
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs sm:text-xs sm:text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 shadow-sm">
                <AlertCircle className="w-3 h-3 sm:w-3 sm:h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden lg:inline">{stats.overdue} Overdue</span>
                <span className="lg:hidden">{stats.overdue}</span>
              </span>
            )}
            {stats.dueToday > 0 && (
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs sm:text-xs sm:text-xs font-semibold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shadow-sm">
                <Calendar className="w-3 h-3 sm:w-3 sm:h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden lg:inline">{stats.dueToday} Due Today</span>
                <span className="lg:hidden">{stats.dueToday}</span>
              </span>
            )}
            {stats.urgent > 0 && (
              <span className="inline-flex items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 sm:px-2.5 py-0.5 xs:py-1 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm">
                <Flame className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden lg:inline">{stats.urgent} Urgent</span>
                <span className="lg:hidden">{stats.urgent}</span>
              </span>
            )}
            {stats.dueThisWeek > 0 && (
              <span className="inline-flex items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 sm:px-2.5 py-0.5 xs:py-1 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm">
                <Calendar className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden lg:inline">{stats.dueThisWeek} Due This Week</span>
                <span className="lg:hidden">{stats.dueThisWeek}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-[11px] sm:text-xs text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* Collapsed State Summary - Mobile (below title) */}
      {!isExpanded && (
        <div className="sm:hidden mt-1 xs:mt-1.5 text-[10px] xs:text-[11px] text-gray-600 dark:text-gray-400">
          {stats.overdue > 0 || stats.dueToday > 0 || stats.urgent > 0 || stats.dueThisWeek > 0 ? (
            <div className="flex items-center gap-1 xs:gap-1.5 flex-wrap">
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

      {/* Kanban Columns */}
      {isExpanded && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-y-auto md:overflow-x-auto overflow-x-hidden pb-2 pt-2 sm:pt-3 lg:pt-[10px] -mx-2 sm:-mx-3 lg:mx-0 px-2 sm:px-3 lg:px-0 max-h-[60vh] md:max-h-none">
            <div className="flex flex-col md:flex-row gap-2 sm:gap-3 lg:gap-4 md:min-w-max">
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
            />
            </div>
          </div>
        </DndContext>
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

