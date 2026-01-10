import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, ChevronDown, ChevronUp, GripVertical, Edit2, Trash2, CircleDot } from 'lucide-react';
import { Task } from '../../types/client';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useTouchDevice } from '../../hooks/useTouchDevice';

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
  isUpdating?: boolean;
}

const SortableTaskItemComponent: React.FC<SortableTaskItemProps> = ({
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
  isUpdating = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuPositionAbove, setMenuPositionAbove] = useState(false);
  const [menuPositionLeft, setMenuPositionLeft] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);
  const isTouchDevice = useTouchDevice();
  const taskItemRef = useRef<HTMLDivElement>(null);
  const lastToggleTimeRef = useRef<number>(0);

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
  
  // Scroll into view when task is expanded - only if not fully visible
  useEffect(() => {
    if (isExpanded && taskItemRef.current) {
      // Use setTimeout to ensure DOM has updated with expanded content
      setTimeout(() => {
        const element = taskItemRef.current;
        if (!element) {
          return;
        }
        
        // Check if element is significantly out of view
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        
        // Only scroll if element is significantly out of view
        // Be very lenient to avoid moving the button under the cursor
        const isSignificantlyOutOfView = 
          rect.bottom > viewportHeight + 100 || // Bottom is more than 100px below viewport
          rect.top < -100; // Top is more than 100px above viewport
        
        if (isSignificantlyOutOfView) {
          // Use a gentle scroll
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        }
      }, 150);
    }
  }, [isExpanded, task.id]);

  // Calculate menu position to prevent overflow
  useEffect(() => {
    if (statusMenuOpen === task.id && taskItemRef.current) {
      let retryCount = 0;
      const maxRetries = 5; // Prevent infinite loops
      
      // Use requestAnimationFrame to ensure menu is rendered and measured
      const calculatePosition = () => {
        if (!taskItemRef.current || !statusMenuRef.current) {
          // Menu not ready yet, try again (with limit)
          if (retryCount < maxRetries) {
            retryCount++;
            requestAnimationFrame(calculatePosition);
          }
          return;
        }
        
        const taskRect = taskItemRef.current.getBoundingClientRect();
        const menuRect = statusMenuRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        
        // Use actual menu dimensions if available, otherwise use estimates
        const menuHeight = menuRect.height > 0 ? menuRect.height : 50;
        const menuWidth = menuRect.width > 0 ? menuRect.width : 220;
        
        if (isTouchDevice) {
          // Mobile: Use absolute positioning
          const spaceBelow = viewportHeight - taskRect.bottom;
          const spaceAbove = taskRect.top;
          setMenuPositionAbove(spaceBelow < menuHeight && spaceAbove > menuHeight);
          setMenuPositionLeft(false);
          setMenuPosition(null);
        } else {
          // Desktop: Calculate fixed position to prevent viewport overflow
          const spaceBelow = viewportHeight - taskRect.bottom;
          const spaceAbove = taskRect.top;
          const spaceRight = viewportWidth - taskRect.right;
          const spaceLeft = taskRect.left;
          
          // Determine vertical position
          const positionAbove = spaceBelow < menuHeight && spaceAbove > menuHeight;
          setMenuPositionAbove(positionAbove);
          
          // Determine horizontal position
          let left: number | undefined;
          let right: number | undefined;
          
          if (spaceRight >= menuWidth) {
            // Enough space on right - align to right edge of task
            right = viewportWidth - taskRect.right;
          } else if (spaceLeft >= menuWidth) {
            // Not enough space on right, but enough on left - position on left
            left = taskRect.left;
          } else {
            // Not enough space on either side - use whichever has more space
            if (spaceRight > spaceLeft) {
              right = 8; // 8px from viewport edge
            } else {
              left = 8; // 8px from viewport edge
            }
          }
          
          setMenuPositionLeft(!!left);
          const position: { top?: string; bottom?: string; left?: string; right?: string } = {};
          if (positionAbove) {
            position.bottom = `${viewportHeight - taskRect.top + 4}px`;
          } else {
            position.top = `${taskRect.bottom + 4}px`;
          }
          if (left !== undefined) {
            position.left = `${left}px`;
          }
          if (right !== undefined) {
            position.right = `${right}px`;
          }
          setMenuPosition(position);
        }
      };
      
      // Start calculation on next frame
      requestAnimationFrame(calculatePosition);
      
      // Recalculate on window resize
      const handleResize = () => {
        if (statusMenuOpen === task.id && taskItemRef.current && statusMenuRef.current) {
          requestAnimationFrame(calculatePosition);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    } else {
      setMenuPosition(null);
    }
  }, [statusMenuOpen, task.id, isTouchDevice]);

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
      className={`relative bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all group w-full max-w-full ${
        isDragging ? 'shadow-lg scale-105' : 'shadow-sm'
      } ${isUpdating ? 'opacity-75' : ''}`}
      onMouseEnter={() => !isTouchDevice && setShowActions(true)}
      onMouseLeave={() => !isTouchDevice && setShowActions(false)}
      onTouchStart={handleTouchStart}
    >
      <div className="flex items-start gap-0.5 sm:gap-1 p-0.5 sm:p-1">
        {/* Drag Handle - Only this area is draggable */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors pt-0.5 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
        </div>

        {/* Task Content */}
        <div 
          className="flex-1 min-w-0"
        >
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <div className="font-medium text-[9px] sm:text-[10px] md:text-xs text-gray-900 dark:text-white truncate flex-1 min-w-0">
              {task.title}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
            <span className={`px-0.5 sm:px-1 py-0.5 rounded-full text-[8px] sm:text-[9px] font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            {isOverdue && (
              <span className="text-[8px] sm:text-[9px] text-red-600 dark:text-red-400 flex items-center gap-0.5">
                <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Overdue</span>
                <span className="sm:hidden">!</span>
              </span>
            )}
          </div>
          </div>
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 truncate flex-1 min-w-0">
            {clientName}
          </div>
          {task.due_date && (
              <div className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                {isTouchDevice 
                  ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                }
            </div>
          )}
          </div>
          
          {/* Expanded Details */}
          {isExpanded && task.description && (
            <div className="mt-0.5 sm:mt-1 pt-0.5 sm:pt-1 border-t border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out w-full max-w-full overflow-hidden">
              <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words max-h-[180px] sm:max-h-[220px] md:max-h-[250px] overflow-y-auto overflow-x-hidden pr-0.5 w-full max-w-full" style={{ scrollbarWidth: 'thin' }}>
                {task.description}
              </div>
            </div>
          )}
          
          {/* Expand/Collapse Indicator */}
          {task.description && (
            <button
              onClick={(e) => {
                const now = Date.now();
                const timeSinceLastToggle = now - lastToggleTimeRef.current;
                
                // Prevent rapid clicks (cooldown period)
                if (timeSinceLastToggle < 300) {
                  e.stopPropagation();
                  e.preventDefault();
                  return;
                }
                
                e.stopPropagation();
                e.preventDefault();
                lastToggleTimeRef.current = now;
                setIsExpanded(!isExpanded);
              }}
              onTouchEnd={(e) => {
                const now = Date.now();
                const timeSinceLastToggle = now - lastToggleTimeRef.current;
                
                // Prevent rapid touches (cooldown period)
                if (timeSinceLastToggle < 300) {
                  e.stopPropagation();
                  e.preventDefault();
                  return;
                }
                
                e.stopPropagation();
                e.preventDefault();
                lastToggleTimeRef.current = now;
                setIsExpanded(!isExpanded);
              }}
              className="mt-0.5 text-[8px] sm:text-[9px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-0.5 transition-colors min-h-[32px] sm:min-h-0 py-0.5 touch-manipulation"
              type="button"
              aria-label={isExpanded ? 'Collapse description' : 'Expand description'}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Less</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
          className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex items-center gap-0.5 transition-opacity z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md p-0.5 shadow-sm max-w-[calc(100%-0.5rem)] ${
            isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleStatusClick}
            className="p-1.5 sm:p-0.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
            title="Change status"
          >
            <CircleDot className="w-4 h-4 sm:w-3 sm:h-3" />
          </button>
          <button
            onClick={handleEditClick}
            className="p-1.5 sm:p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4 sm:w-3 sm:h-3" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-1.5 sm:p-0.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4 sm:w-3 sm:h-3" />
          </button>
        </div>
      )}

      {/* Status Menu - Bottom sheet on mobile, inline on desktop */}
      {statusMenuOpen === task.id && (
        <>
          {/* Mobile: Bottom Sheet Overlay */}
          {isTouchDevice && (
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={(e) => {
                e.stopPropagation();
                onStatusClick(task.id);
              }}
            />
          )}
          
          {/* Status Menu */}
          <div 
            ref={statusMenuRef}
            className={`${isTouchDevice ? 'fixed bottom-0 left-0 right-0 z-50 rounded-t-xl shadow-2xl' : 'fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-0.5 px-0.5'} flex items-center gap-0.5 flex-wrap ${
              isTouchDevice 
                ? 'bg-white dark:bg-gray-800 p-4 pb-safe-bottom animate-slide-up'
                : ''
            }`}
            style={
              !isTouchDevice 
                ? {
                    ...menuPosition,
                    maxWidth: 'min(calc(100vw - 1rem), 220px)'
                  }
                : {}
            }
            onClick={(e) => e.stopPropagation()}
          >
            {isTouchDevice && (
              <div className="w-full mb-3">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2"></div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white text-center mb-3">
                  Change Status
                </h3>
              </div>
            )}
            <div className={`${isTouchDevice ? 'w-full grid grid-cols-1 gap-2' : 'flex items-center gap-0.5 flex-wrap'}`}>
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
                  className={`${isTouchDevice 
                    ? 'w-full px-4 py-3 text-sm font-medium rounded-lg text-left transition-colors' 
                    : 'px-1 py-1 sm:px-1 sm:py-0.5 text-[8px] sm:text-[9px] md:text-[10px] rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap min-h-[32px] sm:min-h-0'
                  } ${
                    task.status === statusOption.value
                      ? isTouchDevice
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : isTouchDevice
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                        : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {statusOption.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        recordDetails={
          <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
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

export const SortableTaskItem = React.memo(SortableTaskItemComponent, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.position === nextProps.task.position &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.due_date === nextProps.task.due_date &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.clientName === nextProps.clientName &&
    prevProps.isOverdue === nextProps.isOverdue &&
    prevProps.statusMenuOpen === nextProps.statusMenuOpen &&
    prevProps.isUpdating === nextProps.isUpdating
  );
});

SortableTaskItem.displayName = 'SortableTaskItem';
