import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../../types/client';
import { SortableTaskItem } from './SortableTaskItem';
import { isTaskOverdue } from '../../utils/taskDateUtils';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  getClientName: (clientId: string) => string;
  getPriorityColor: (priority: Task['priority']) => string;
  getStatusColor: (status: Task['status']) => string;
  statusMenuOpen: string | null;
  statusMenuRef: React.RefObject<HTMLDivElement>;
  onStatusClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  color: string;
  isDraggingTask?: string | null;
  maxVisibleTasks?: number;
}

const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  getClientName,
  getPriorityColor,
  getStatusColor,
  statusMenuOpen,
  statusMenuRef,
  onStatusClick,
  onStatusChange,
  onTaskClick,
  onTaskDelete,
  color,
  isDraggingTask = null,
  maxVisibleTasks,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const taskIds = tasks.map(task => task.id);

  return (
    <div 
      className="flex flex-col w-full sm:w-[280px] sm:min-w-[280px] md:w-auto md:flex-1 md:min-w-[220px] lg:min-w-[240px] xl:min-w-[260px] 2xl:min-w-[280px] max-w-full snap-start flex-shrink-0"
    >
      {/* Column Header */}
      <div className={`mb-1 sm:mb-1.5 md:mb-2 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg ${color} border border-gray-200 dark:border-gray-700 sticky top-0 z-10 md:relative md:z-auto shadow-sm`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-900 dark:text-white truncate flex-1 min-w-0">
            {title}
          </h3>
          <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0 min-w-[24px] sm:min-w-[28px] text-center">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[180px] sm:min-h-[180px] md:min-h-[180px] ${maxVisibleTasks === 3 ? 'max-h-[180px] sm:max-h-[200px] md:max-h-[220px]' : 'max-h-[300px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[450px] xl:max-h-[500px]'} rounded-md sm:rounded-lg p-1 sm:p-1.5 md:p-2 transition-colors overflow-y-auto ${
          isOver
            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 border-dashed'
            : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
        }`}
        style={{ scrollbarWidth: 'thin' }}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const clientName = getClientName(task.client_id);
                const isOverdue = isTaskOverdue(task.due_date, task.status);

                return (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    clientName={clientName}
                    isOverdue={isOverdue}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                    statusMenuOpen={statusMenuOpen}
                    statusMenuRef={statusMenuRef}
                    onStatusClick={onStatusClick}
                    onStatusChange={onStatusChange}
                    onTaskClick={onTaskClick}
                    onTaskDelete={onTaskDelete}
                    isUpdating={isDraggingTask === task.id}
                  />
                );
              })
            ) : (
              <div className="text-center py-4 sm:py-6 md:py-8 text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs md:text-sm">
                No tasks
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export const KanbanColumn = React.memo(KanbanColumnComponent, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.tasks.length === nextProps.tasks.length &&
    prevProps.tasks.every((task, index) => 
      task.id === nextProps.tasks[index]?.id &&
      task.position === nextProps.tasks[index]?.position &&
      task.status === nextProps.tasks[index]?.status
    ) &&
    prevProps.statusMenuOpen === nextProps.statusMenuOpen &&
    prevProps.color === nextProps.color &&
    prevProps.isDraggingTask === nextProps.isDraggingTask
  );
});

KanbanColumn.displayName = 'KanbanColumn';

