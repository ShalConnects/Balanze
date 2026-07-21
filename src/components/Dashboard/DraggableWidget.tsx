import React, { ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DASHBOARD_WIDGET_DRAG_BTN } from '../../constants/dashboardWidget';

interface DraggableWidgetProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const DraggableWidget: React.FC<DraggableWidgetProps> = ({
  id,
  children,
  className = '',
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  if (children === null || children === undefined) {
    return null;
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${className}`}
    >
      <div
        {...attributes}
        {...listeners}
        className={DASHBOARD_WIDGET_DRAG_BTN}
        title="Drag to reorder"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
      </div>
      {children}
    </div>
  );
};
