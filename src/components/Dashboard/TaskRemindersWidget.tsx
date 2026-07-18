import React, { useState, useEffect, useMemo } from 'react';
import { Check, CheckCircle, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useClientStore } from '../../store/useClientStore';
import { Task } from '../../types/client';
import { getTaskPriorityColor, getTaskStatusColor } from '../../utils/clientUtils';
import {
  getTodayNormalized,
  normalizeTaskDate,
  isTaskOverdue,
  isTaskDueToday,
  isTaskDueThisWeek,
  getDaysOverdue,
} from '../../utils/taskDateUtils';
import {
  DASHBOARD_WIDGET_ACCORDION_BTN,
  DASHBOARD_WIDGET_BADGE,
  DASHBOARD_WIDGET_CONTENT,
  DASHBOARD_WIDGET_HEADER,
  DASHBOARD_WIDGET_HEADER_BORDER,
  DASHBOARD_WIDGET_ROW,
  DASHBOARD_WIDGET_SHELL,
  DASHBOARD_WIDGET_TITLE,
  DASHBOARD_WIDGET_VIEW_ALL,
} from '../../constants/dashboardWidget';

interface TaskRemindersWidgetProps {
  onHide?: () => void;
  isAccordionExpanded?: boolean;
  onAccordionToggle?: () => void;
}

const STATUS_LABELS: Record<Task['status'], string> = {
  in_progress: 'In Progress',
  waiting_on_client: 'Waiting on Client',
  waiting_on_me: 'Waiting on Me',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const URGENCY_BAR: Record<string, string> = {
  Overdue: 'bg-red-500',
  'Due Today': 'bg-orange-500',
  Urgent: 'bg-amber-500',
};

type PrioritizedTask = {
  task: Task;
  sortKey: number;
  urgencyLabel: string;
  daysInfo: string;
};

function daysUntil(dueDate: string): number {
  const today = getTodayNormalized();
  const due = normalizeTaskDate(dueDate);
  return Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function prioritizeTask(task: Task): PrioritizedTask {
  let sortKey = 5;
  let urgencyLabel = '';
  let daysInfo = '';

  if (task.due_date) {
    if (isTaskOverdue(task.due_date, task.status)) {
      sortKey = 1;
      urgencyLabel = 'Overdue';
      daysInfo = `${getDaysOverdue(task.due_date, task.status)}d overdue`;
    } else if (isTaskDueToday(task.due_date, task.status)) {
      sortKey = 2;
      urgencyLabel = 'Due Today';
      daysInfo = 'Due today';
    } else if (isTaskDueThisWeek(task.due_date, task.status)) {
      sortKey = 3;
      urgencyLabel = 'Due Soon';
      daysInfo = `in ${daysUntil(task.due_date)}d`;
    } else {
      sortKey = 4;
      urgencyLabel = 'Upcoming';
      daysInfo = `in ${daysUntil(task.due_date)}d`;
    }
  }

  if (task.priority === 'urgent' && sortKey > 1) {
    sortKey = 1.5;
    urgencyLabel = urgencyLabel || 'Urgent';
  }

  return { task, sortKey, urgencyLabel, daysInfo };
}

function TaskReminderRow({
  item,
  clientName,
  onComplete,
}: {
  item: PrioritizedTask;
  clientName: string;
  onComplete: (id: string) => void;
}) {
  const { task, urgencyLabel, daysInfo } = item;
  const barClass = URGENCY_BAR[urgencyLabel] || 'bg-transparent';
  const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

  return (
    <div className={DASHBOARD_WIDGET_ROW}>
      <div className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${barClass}`} />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onComplete(task.id);
        }}
        className="mt-1.5 flex-shrink-0 w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 text-gray-400 hover:border-green-500 hover:text-green-600 flex items-center justify-center touch-manipulation"
        title="Mark as complete"
        aria-label={`Complete ${task.title}`}
      >
        <Check className="w-2.5 h-2.5" />
      </button>
      <Link
        to="/clients"
        className="flex-1 min-w-0 py-1.5 pr-1 touch-manipulation"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate leading-snug">
          {task.title}
        </p>
        <p className="mt-0.5 flex items-center gap-1 flex-wrap text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
          <span className={`font-medium ${getTaskPriorityColor(task.priority)}`}>{priorityLabel}</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className={`font-medium ${getTaskStatusColor(task.status)}`}>
            {STATUS_LABELS[task.status]}
          </span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="truncate max-w-[120px] sm:max-w-none">{clientName}</span>
          {daysInfo && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span
                className={
                  urgencyLabel === 'Overdue'
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : urgencyLabel === 'Due Today'
                      ? 'text-orange-600 dark:text-orange-400 font-medium'
                      : ''
                }
              >
                {daysInfo}
              </span>
            </>
          )}
        </p>
      </Link>
    </div>
  );
}

export const TaskRemindersWidget: React.FC<TaskRemindersWidgetProps> = ({
  isAccordionExpanded = true,
  onAccordionToggle,
}) => {
  const { tasks, clients, fetchTasks, fetchClients, updateTask, tasksLoading } = useClientStore();
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allActiveTasks = useMemo(
    () => (tasks || []).filter((t) => t.status !== 'completed' && t.status !== 'cancelled'),
    [tasks]
  );

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clients]);

  const prioritized = useMemo(
    () => allActiveTasks.map(prioritizeTask).sort((a, b) => a.sortKey - b.sortKey),
    [allActiveTasks]
  );

  const visibleTasks = useMemo(
    () => (showAll ? prioritized : prioritized.filter((item) => item.sortKey <= 3)),
    [prioritized, showAll]
  );

  const stats = useMemo(() => {
    let overdue = 0;
    let dueToday = 0;
    let urgent = 0;
    for (const t of allActiveTasks) {
      if (isTaskOverdue(t.due_date, t.status)) overdue++;
      else if (isTaskDueToday(t.due_date, t.status)) dueToday++;
      if (t.priority === 'urgent') urgent++;
    }
    return { overdue, dueToday, urgent };
  }, [allActiveTasks]);

  const hasUrgentTasks = stats.overdue > 0 || stats.dueToday > 0 || stats.urgent > 0;

  const handleMarkComplete = async (taskId: string) => {
    await updateTask(taskId, { status: 'completed' });
    fetchTasks();
  };

  if ((tasksLoading && tasks.length === 0) || tasks.length === 0 || allActiveTasks.length === 0) {
    return null;
  }

  return (
    <div className={DASHBOARD_WIDGET_SHELL}>
      {onAccordionToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAccordionToggle();
          }}
          className={DASHBOARD_WIDGET_ACCORDION_BTN}
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

      <div
        className={`${DASHBOARD_WIDGET_HEADER} ${
          isAccordionExpanded ? DASHBOARD_WIDGET_HEADER_BORDER : ''
        }`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <h3 className={DASHBOARD_WIDGET_TITLE}>Client Task</h3>
          <div className="flex items-center gap-0.5 min-w-0 flex-nowrap overflow-hidden">
            {hasUrgentTasks ? (
              (
                [
                  { count: stats.overdue, short: 'od', full: 'overdue', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
                  { count: stats.dueToday, short: 'td', full: 'due today', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
                  { count: stats.urgent, short: 'urg', full: 'urgent', className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
                ] as const
              )
                .filter((b) => b.count > 0)
                .map((b) => (
                  <span
                    key={b.full}
                    title={`${b.count} ${b.full}`}
                    aria-label={`${b.count} ${b.full}`}
                    className={`${DASHBOARD_WIDGET_BADGE} flex-shrink-0 ${b.className}`}
                  >
                    {b.count} {b.short}
                  </span>
                ))
            ) : (
              <span className={`${DASHBOARD_WIDGET_BADGE} flex-shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400`}>
                All clear
              </span>
            )}
          </div>
        </div>
        <Link to="/clients" className={DASHBOARD_WIDGET_VIEW_ALL}>
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {isAccordionExpanded && (
        <div className={`${DASHBOARD_WIDGET_CONTENT} max-h-[250px] sm:max-h-[280px] overflow-y-auto`}>
          {!hasUrgentTasks && !showAll ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No urgent tasks at the moment</p>
            </div>
          ) : (
            <>
              <div>
                {visibleTasks.map((item) => (
                  <TaskReminderRow
                    key={item.task.id}
                    item={item}
                    clientName={clientNameById.get(item.task.client_id) || 'Unknown Client'}
                    onComplete={handleMarkComplete}
                  />
                ))}
              </div>
              {allActiveTasks.length > visibleTasks.length || showAll ? (
                <div className="py-1.5 border-t border-blue-200/50 dark:border-blue-800/50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAll(!showAll);
                    }}
                    className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium touch-manipulation"
                  >
                    {showAll ? 'Show only urgent tasks' : `Show all ${allActiveTasks.length} tasks`}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
};
