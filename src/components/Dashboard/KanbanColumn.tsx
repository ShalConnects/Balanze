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
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const taskIds = tasks.map(task => task.id);

  return (
    <div className="flex flex-col w-full md:min-w-[200px] lg:min-w-[220px] xl:min-w-[240px]">
      {/* Column Header */}
      <div className={`mb-1 sm:mb-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md ${color} border border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-900 dark:text-white truncate pr-1">
            {title}
          </h3>
          <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-1 py-0.5 rounded-full flex-shrink-0">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[100px] sm:min-h-[120px] max-h-[280px] md:max-h-[350px] lg:max-h-[400px] rounded-md p-0.5 sm:p-1 transition-colors overflow-y-auto ${
          isOver
            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 border-dashed'
            : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
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
              <div className="text-center py-3 text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs">
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

