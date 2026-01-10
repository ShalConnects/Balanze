import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, ChevronDown, ChevronUp, GripVertical, Edit2, Trash2, CircleDot } from 'lucide-react';
import { Task } from '../../types/client';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

interface SortableTaskItemProps {
  task: Task;
  clientName: string;
  isOverdue: boolean;
  getPriorityColor: (priority: Task['priority']) => string;
  getStatusColor: (status: Task['status']) => string;
  statusMenuOpen: string | null;
  statusMenuRef: React.RefObject<HTMLDivElement>;
  onStatusClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

export const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  clientName,
  isOverdue,
  getPriorityColor,
  getStatusColor,
  statusMenuOpen,
  statusMenuRef,
  onStatusClick,
  onStatusChange,
  onTaskClick,
  onTaskDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const taskItemRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
  });

  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouchDevice();
  }, []);

  // Scroll into view when task is expanded
  useEffect(() => {
    if (isExpanded && taskItemRef.current) {
      // Use setTimeout to ensure DOM has updated with expanded content
      setTimeout(() => {
        taskItemRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }, 100);
    }
  }, [isExpanded]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTaskClick(task);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    onTaskDelete(task.id);
    setShowDeleteModal(false);
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStatusClick(task.id);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTouchDevice) {
      setShowActions(true);
    }
  };

  // Combine refs for sortable and scroll-into-view
  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    taskItemRef.current = node;
  };

  return (
    <div
      ref={combinedRef}
      style={style}
      className={`relative bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all group ${
        isDragging ? 'shadow-lg scale-105' : 'shadow-sm'
      }`}
      onMouseEnter={() => !isTouchDevice && setShowActions(true)}
      onMouseLeave={() => !isTouchDevice && setShowActions(false)}
      onTouchStart={handleTouchStart}
    >
      <div className="flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2">
        {/* Drag Handle - Only this area is draggable */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors pt-0.5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-6 h-6 sm:w-4 sm:h-4" />
        </div>

        {/* Task Content */}
        <div 
          className="flex-1 min-w-0"
        >
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate flex-1 min-w-0">
              {task.title}
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <span className={`px-1.5 sm:px-1.5 py-0.5 rounded-full text-xs sm:text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            {isOverdue && (
              <span className="text-xs sm:text-xs text-red-600 dark:text-red-400 flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Overdue</span>
                <span className="sm:hidden">!</span>
              </span>
            )}
          </div>
          </div>
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="text-xs sm:text-xs text-gray-500 dark:text-gray-400 truncate flex-1 min-w-0">
            {clientName}
          </div>
          {task.due_date && (
              <div className="text-xs sm:text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                {isTouchDevice 
                  ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                }
            </div>
          )}
          </div>
          
          {/* Expanded Details */}
          {isExpanded && task.description && (
            <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
                {task.description}
              </div>
            </div>
          )}
          
          {/* Expand/Collapse Indicator */}
          {task.description && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-0.5 sm:mt-1 text-xs sm:text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-0.5 transition-colors min-h-[44px] sm:min-h-0 py-1 sm:py-0"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Less</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">More</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Buttons - Absolutely positioned overlay, show on hover or touch */}
      {showActions && (
        <div 
          className={`absolute top-1 right-1 sm:top-1.5 sm:right-1.5 flex items-center gap-0.5 transition-opacity z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md p-0.5 shadow-sm ${
            isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleStatusClick}
            className="p-2 sm:p-0.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            title="Change status"
          >
            <CircleDot className="w-5 h-5 sm:w-3 sm:h-3" />
          </button>
          <button
            onClick={handleEditClick}
            className="p-2 sm:p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            title="Edit task"
          >
            <Edit2 className="w-5 h-5 sm:w-3 sm:h-3" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 sm:p-0.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            title="Delete task"
          >
            <Trash2 className="w-5 h-5 sm:w-3 sm:h-3" />
          </button>
        </div>
      )}

      {/* Status Menu - Inline horizontal list */}
      {statusMenuOpen === task.id && (
        <div 
          ref={statusMenuRef}
          className={`absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 px-1 flex items-center gap-1 flex-wrap max-w-[calc(100vw-2rem)] sm:max-w-none ${
            isTouchDevice ? 'top-12 left-0 right-0 mx-2' : 'top-8 right-1.5'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Waiting on Client', value: 'waiting_on_client' },
            { label: 'Waiting on Me', value: 'waiting_on_me' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
          ].map((statusOption) => (
            <button
              key={statusOption.value}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, statusOption.value as Task['status']);
              }}
              className={`px-2 py-2 sm:px-1.5 sm:py-0.5 text-xs sm:text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap min-h-[44px] sm:min-h-0 ${
                task.status === statusOption.value
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {statusOption.label}
            </button>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        recordDetails={
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <div><span className="font-medium">Task:</span> {task.title}</div>
            {task.due_date && (
              <div><span className="font-medium">Due Date:</span> {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            )}
            <div><span className="font-medium">Priority:</span> {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</div>
            <div><span className="font-medium">Client:</span> {clientName}</div>
          </div>
        }
        confirmLabel="Delete Task"
        cancelLabel="Cancel"
      />
    </div>
  );
};
