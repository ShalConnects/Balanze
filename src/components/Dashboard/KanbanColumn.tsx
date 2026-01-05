import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../../types/client';
import { SortableTaskItem } from './SortableTaskItem';

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
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
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
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const taskIds = tasks.map(task => task.id);

  return (
    <div className="flex flex-col w-full min-w-[180px] xs:min-w-[200px] sm:min-w-[220px] md:min-w-[240px] lg:min-w-[260px]">
      {/* Column Header */}
      <div className={`mb-1.5 sm:mb-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md ${color} border border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] sm:text-xs font-semibold text-gray-900 dark:text-white truncate pr-1">
            {title}
          </h3>
          <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-1 sm:px-1.5 py-0.5 rounded-full flex-shrink-0">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[100px] xs:min-h-[120px] sm:min-h-[150px] max-h-[200px] xs:max-h-[250px] sm:max-h-[300px] rounded-md p-1 sm:p-1.5 transition-colors overflow-y-auto ${
          isOver
            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 border-dashed'
            : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const clientName = getClientName(task.client_id);
                // Normalize dates to start of day for accurate overdue comparison
                let isOverdue = false;
                if (task.due_date && task.status !== 'completed') {
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const dueDateStr = task.due_date.split('T')[0]; // Get YYYY-MM-DD part
                  const [year, month, day] = dueDateStr.split('-').map(Number);
                  const dueDate = new Date(year, month - 1, day);
                  isOverdue = dueDate < today;
                }

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
                  />
                );
              })
            ) : (
              <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-[10px]">
                No tasks
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

