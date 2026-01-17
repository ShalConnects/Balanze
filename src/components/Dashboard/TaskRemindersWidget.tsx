import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Flame, Calendar, CheckCircle, Edit2, Eye, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useClientStore } from '../../store/useClientStore';
import { Task } from '../../types/client';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface TaskRemindersWidgetProps {
  onHide?: () => void;
  isAccordionExpanded?: boolean;
  onAccordionToggle?: () => void;
}

export const TaskRemindersWidget: React.FC<TaskRemindersWidgetProps> = ({ 
  onHide,
  isAccordionExpanded = true,
  onAccordionToggle
}) => {
  const { tasks, clients, fetchTasks, fetchClients, updateTask, error, tasksLoading } = useClientStore();
  const { isMobile } = useMobileDetection();
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter out completed and cancelled tasks
  const allActiveTasks = (tasks || []).filter(task => task.status !== 'completed' && task.status !== 'cancelled');

  // Calculate urgent tasks with prioritization
  const urgentTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const prioritized = allActiveTasks.map(task => {
      let priority = 0;
      let urgencyLabel = '';
      let daysInfo = '';

      if (task.due_date) {
        const dueDateStr = task.due_date.split('T')[0];
        const [year, month, day] = dueDateStr.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
          priority = 1; // Overdue - highest priority
          urgencyLabel = 'Overdue';
          daysInfo = `${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? 'day' : 'days'} overdue`;
        } else if (daysDiff === 0) {
          priority = 2; // Due today
          urgencyLabel = 'Due Today';
          daysInfo = 'Due today';
        } else if (daysDiff <= 7) {
          priority = 3; // Due this week
          urgencyLabel = 'Due Soon';
          daysInfo = `Due in ${daysDiff} ${daysDiff === 1 ? 'day' : 'days'}`;
        } else {
          priority = 4; // Future
          urgencyLabel = 'Upcoming';
          daysInfo = `Due in ${daysDiff} days`;
        }
      }

      // Boost priority if urgent
      if (task.priority === 'urgent' && priority > 1) {
        priority = 1.5; // Urgent but not overdue
        urgencyLabel = urgencyLabel || 'Urgent';
      }

      return { task, priority, urgencyLabel, daysInfo };
    });

    // Sort by priority (lower number = higher priority)
    return prioritized
      .filter(item => showAll || item.priority <= 3) // Filter: show all or only urgent/overdue/due today
      .sort((a, b) => a.priority - b.priority);
  }, [allActiveTasks, showAll]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const overdue = allActiveTasks.filter(t => {
      if (!t.due_date) return false;
      const dueDateStr = t.due_date.split('T')[0];
      const [year, month, day] = dueDateStr.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day);
      return dueDate < today;
    }).length;

    const dueToday = allActiveTasks.filter(t => {
      if (!t.due_date) return false;
      const dueDateStr = t.due_date.split('T')[0];
      const [year, month, day] = dueDateStr.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day);
      return dueDate.getTime() === today.getTime();
    }).length;

    const urgent = allActiveTasks.filter(t => t.priority === 'urgent').length;

    return { overdue, dueToday, urgent };
  }, [allActiveTasks]);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'medium':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'low':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getUrgencyColor = (urgencyLabel: string) => {
    if (urgencyLabel === 'Overdue') return 'text-red-600 dark:text-red-400';
    if (urgencyLabel === 'Due Today') return 'text-orange-600 dark:text-orange-400';
    if (urgencyLabel === 'Urgent') return 'text-amber-600 dark:text-amber-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const handleMarkComplete = async (taskId: string) => {
    await updateTask(taskId, { status: 'completed' });
    fetchTasks();
  };


  // Calculate if there are any urgent tasks (overdue, due today, or urgent priority)
  const hasUrgentTasks = stats.overdue > 0 || stats.dueToday > 0 || stats.urgent > 0;

  // Show loading state or hide if no tasks exist at all
  if (tasksLoading && tasks.length === 0) {
    return null;
  }

  // Hide widget if there are no tasks at all (including completed/cancelled)
  if (tasks.length === 0) {
    return null;
  }

  // Hide widget if there are no active tasks
  if (allActiveTasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm relative group">
      {/* Toggle Button - positioned like drag handle on left side */}
      {onAccordionToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAccordionToggle();
          }}
          className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 touch-manipulation transition-opacity"
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
      {/* Header */}
      <div className={`flex items-center justify-between py-2 px-3 xs:px-4 sm:px-4 ${isAccordionExpanded ? 'border-b border-blue-200/50 dark:border-blue-800/50' : ''}`}>
        <div className="flex items-center gap-1.5 xs:gap-2 flex-1 min-w-0">
          <h3 className="text-xs xs:text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
            Client Task
          </h3>
          <div className="flex items-center gap-0.5 xs:gap-1 text-[9px] xs:text-[10px] sm:text-xs flex-wrap">
            {hasUrgentTasks ? (
              <>
                {stats.overdue > 0 && (
                  <span className="px-1 xs:px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">
                    {stats.overdue} overdue
                  </span>
                )}
                {stats.dueToday > 0 && (
                  <span className="px-1 xs:px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium">
                    {stats.dueToday} today
                  </span>
                )}
                {stats.urgent > 0 && (
                  <span className="px-1 xs:px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                    {stats.urgent} urgent
                  </span>
                )}
              </>
            ) : (
              <span className="px-1 xs:px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                All clear
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 flex-shrink-0">
          <Link
            to="/clients"
            className="text-[9px] xs:text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-0.5 sm:gap-1 touch-manipulation"
          >
            <span className="hidden sm:inline">View All</span>
            <ArrowRight className="w-3 xs:w-3.5 sm:w-4 h-3 xs:h-3.5 sm:h-4" />
          </Link>
        </div>
      </div>

      {/* Content - Fixed height with scroll - Only show when expanded */}
      {isAccordionExpanded && (
        <div className="p-2 xs:p-3 sm:p-4 max-h-[250px] sm:max-h-[280px] overflow-y-auto">
          {urgentTasks.length === 0 || !hasUrgentTasks ? (
            <div className="text-center py-4 xs:py-6 sm:py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle className="w-8 xs:w-10 sm:w-12 h-8 xs:h-10 sm:h-12 mx-auto mb-2 opacity-50" />
              <p className="text-[11px] xs:text-xs sm:text-sm">No urgent tasks at the moment</p>
            </div>
          ) : urgentTasks.length === 1 ? (
            <>
              <div className="grid grid-cols-1 gap-1.5 xs:gap-2">
                {urgentTasks.map(({ task, urgencyLabel, daysInfo }) => {
                  const clientName = getClientName(task.client_id);
                  return (
                    <div
                      key={task.id}
                      className="p-2 xs:p-2.5 sm:p-3 bg-white/60 dark:bg-blue-900/10 rounded-md border-2 border-blue-200/50 dark:border-blue-800/50 group"
                    >
                    <div className="flex-1 min-w-0">
                      {/* Line 1: Task Title with Action Icons */}
                      <div className="flex items-center justify-between gap-1.5 xs:gap-2 mb-1 xs:mb-1.5">
                        <h4 className="font-medium text-gray-900 dark:text-white text-[11px] xs:text-xs sm:text-sm flex-1 min-w-0">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkComplete(task.id);
                            }}
                            className="p-1 xs:p-1.5 text-gray-400 rounded touch-manipulation"
                            title="Mark as complete"
                          >
                            <CheckCircle className="w-3 xs:w-3.5 sm:w-4 h-3 xs:h-3.5 sm:h-4" />
                          </button>
                          <Link
                            to="/clients"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 xs:p-1.5 text-gray-400 rounded touch-manipulation"
                            title="View task"
                          >
                            <Eye className="w-3 xs:w-3.5 sm:w-4 h-3 xs:h-3.5 sm:h-4" />
                          </Link>
                        </div>
                      </div>
                      {/* Line 2: Priority • Urgency • Client • Due Date */}
                      <div className="flex items-center gap-1 xs:gap-1.5 flex-wrap text-[10px] xs:text-xs sm:text-sm">
                        <span className={`px-0.5 xs:px-1 py-0.5 rounded-full text-[8px] xs:text-[9px] font-medium flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        {/* Only show urgencyLabel for Overdue, Due Today, or Urgent - hide for Due Soon/Upcoming */}
                        {urgencyLabel !== 'Due Soon' && urgencyLabel !== 'Upcoming' && urgencyLabel && (
                          <>
                            <span className={`text-[9px] xs:text-[10px] font-medium flex-shrink-0 ${getUrgencyColor(urgencyLabel)}`}>
                              {urgencyLabel}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                          </>
                        )}
                        <span className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 truncate max-w-[80px] xs:max-w-[100px] sm:max-w-none">
                          {clientName}
                        </span>
                        {/* Show daysInfo for Due Soon/Upcoming, or if it exists and not Overdue/Due Today */}
                        {daysInfo && (urgencyLabel === 'Due Soon' || urgencyLabel === 'Upcoming' || (urgencyLabel !== 'Due Today' && urgencyLabel !== 'Overdue')) && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                              {daysInfo}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-1.5 xs:gap-2">
                {urgentTasks.map(({ task, urgencyLabel, daysInfo }) => {
                  const clientName = getClientName(task.client_id);
                  return (
                    <div
                      key={task.id}
                      className="p-2 xs:p-2.5 sm:p-3 bg-white/60 dark:bg-blue-900/10 rounded-md border border-blue-200/50 dark:border-blue-800/50 group"
                    >
                      <div className="flex-1 min-w-0">
                        {/* Line 1: Task Title with Action Icons */}
                        <div className="flex items-center justify-between gap-1.5 xs:gap-2 mb-1 xs:mb-1.5">
                          <h4 className="font-medium text-gray-900 dark:text-white text-[11px] xs:text-xs sm:text-sm flex-1 min-w-0">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkComplete(task.id);
                              }}
                              className="p-1 xs:p-1.5 text-gray-400 rounded touch-manipulation"
                              title="Mark as complete"
                            >
                              <CheckCircle className="w-3 xs:w-3.5 sm:w-4 h-3 xs:h-3.5 sm:h-4" />
                            </button>
                            <Link
                              to="/clients"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 xs:p-1.5 text-gray-400 rounded touch-manipulation"
                              title="View task"
                            >
                              <Eye className="w-3 xs:w-3.5 sm:w-4 h-3 xs:h-3.5 sm:h-4" />
                            </Link>
                          </div>
                        </div>
                        {/* Line 2: Priority • Urgency • Client • Due Date */}
                        <div className="flex items-center gap-1 xs:gap-1.5 flex-wrap text-[10px] xs:text-xs sm:text-sm">
                          <span className={`px-0.5 xs:px-1 py-0.5 rounded-full text-[8px] xs:text-[9px] font-medium flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                          {/* Only show urgencyLabel for Overdue, Due Today, or Urgent - hide for Due Soon/Upcoming */}
                          {urgencyLabel !== 'Due Soon' && urgencyLabel !== 'Upcoming' && urgencyLabel && (
                            <>
                              <span className={`text-[9px] xs:text-[10px] font-medium flex-shrink-0 ${getUrgencyColor(urgencyLabel)}`}>
                                {urgencyLabel}
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                            </>
                          )}
                          <span className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 truncate max-w-[80px] xs:max-w-[100px] sm:max-w-none">
                            {clientName}
                          </span>
                          {/* Show daysInfo for Due Soon/Upcoming, or if it exists and not Overdue/Due Today */}
                          {daysInfo && (urgencyLabel === 'Due Soon' || urgencyLabel === 'Upcoming' || (urgencyLabel !== 'Due Today' && urgencyLabel !== 'Overdue')) && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <span className="text-[9px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                {daysInfo}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Show All Toggle */}
              {allActiveTasks.length > urgentTasks.length && (
                <div className="mt-2 xs:mt-3 pt-2 xs:pt-3 border-t border-blue-200/50 dark:border-blue-800/50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAll(!showAll);
                    }}
                    className="text-[10px] xs:text-xs text-blue-600 dark:text-blue-400 font-medium touch-manipulation"
                  >
                    {showAll ? 'Show only urgent tasks' : `Show all ${allActiveTasks.length} tasks`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

