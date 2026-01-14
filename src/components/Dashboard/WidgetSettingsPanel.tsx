import React, { useState } from 'react';
import { Settings, GripVertical, Eye, EyeOff, RotateCcw, X } from 'lucide-react';
import Modal from 'react-modal';

export interface WidgetConfig {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}

export interface MainDashboardWidget {
  id: string;
  name: string;
  visible: boolean;
  available: boolean;
  order: number;
}

interface WidgetSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onUpdate: (widgets: WidgetConfig[]) => void;
  onReset: () => void;
  mainDashboardWidgets?: MainDashboardWidget[];
  onMainDashboardWidgetToggle?: (id: string, visible: boolean) => void;
  onMainDashboardWidgetUpdate?: (widgets: MainDashboardWidget[]) => void;
}

export const WidgetSettingsPanel: React.FC<WidgetSettingsPanelProps> = ({
  isOpen,
  onClose,
  widgets,
  onUpdate,
  onReset,
  mainDashboardWidgets = [],
  onMainDashboardWidgetToggle,
  onMainDashboardWidgetUpdate,
}) => {
  const [localWidgets, setLocalWidgets] = useState<WidgetConfig[]>(widgets);
  const [localMainDashboardWidgets, setLocalMainDashboardWidgets] = useState<MainDashboardWidget[]>(mainDashboardWidgets);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggedMainDashboardId, setDraggedMainDashboardId] = useState<string | null>(null);
  const [dragOverMainDashboardId, setDragOverMainDashboardId] = useState<string | null>(null);

  // Initialize local state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalWidgets([...widgets]);
      setLocalMainDashboardWidgets([...mainDashboardWidgets]);
    }
  }, [isOpen, widgets, mainDashboardWidgets]);

  const handleToggleVisibility = (id: string) => {
    const updated = localWidgets.map(w =>
      w.id === id ? { ...w, visible: !w.visible } : w
    );
    setLocalWidgets(updated);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = localWidgets.findIndex(w => w.id === draggedId);
    const targetIndex = localWidgets.findIndex(w => w.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    const newWidgets = [...localWidgets];
    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    // Update order numbers
    const reordered = newWidgets.map((w, index) => ({
      ...w,
      order: index,
    }));

    setLocalWidgets(reordered);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Main Dashboard Widgets drag handlers
  const handleMainDashboardDragStart = (e: React.DragEvent, id: string) => {
    setDraggedMainDashboardId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleMainDashboardDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedMainDashboardId && draggedMainDashboardId !== id) {
      setDragOverMainDashboardId(id);
    }
  };

  const handleMainDashboardDragLeave = () => {
    setDragOverMainDashboardId(null);
  };

  const handleMainDashboardDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverMainDashboardId(null);

    if (!draggedMainDashboardId || draggedMainDashboardId === targetId) {
      setDraggedMainDashboardId(null);
      return;
    }

    const draggedIndex = localMainDashboardWidgets.findIndex(w => w.id === draggedMainDashboardId);
    const targetIndex = localMainDashboardWidgets.findIndex(w => w.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedMainDashboardId(null);
      return;
    }

    const newWidgets = [...localMainDashboardWidgets];
    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    // Update order numbers
    const reordered = newWidgets.map((w, index) => ({
      ...w,
      order: index,
    }));

    setLocalMainDashboardWidgets(reordered);
    setDraggedMainDashboardId(null);
  };

  const handleMainDashboardDragEnd = () => {
    setDraggedMainDashboardId(null);
    setDragOverMainDashboardId(null);
  };

  const handleSave = () => {
    onUpdate(localWidgets);
    if (onMainDashboardWidgetUpdate) {
      onMainDashboardWidgetUpdate(localMainDashboardWidgets);
    }
    onClose();
  };

  const handleCancel = () => {
    setLocalWidgets([...widgets]);
    setLocalMainDashboardWidgets([...mainDashboardWidgets]);
    onClose();
  };

  const sortedWidgets = [...localWidgets].sort((a, b) => a.order - b.order);
  const sortedMainDashboardWidgets = [...localMainDashboardWidgets]
    .filter(w => w.available)
    .sort((a, b) => a.order - b.order);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleCancel}
      className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
      overlayClassName="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-md z-40"
      ariaHideApp={false}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 md:p-6 w-full max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] overflow-y-auto shadow-lg mx-2 sm:mx-4">
        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white pr-2">
            Customize Dashboard Widgets
          </h2>
          <button
            onClick={handleCancel}
            className="p-1.5 sm:p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 md:mb-4">
          Drag to reorder widgets or toggle visibility. Changes are saved automatically.
        </p>

        {/* Two Column Layout: Main Dashboard Widgets (Left) and Right Sidebar Widgets (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4">
          {/* Left Column: Main Dashboard Widgets */}
          {sortedMainDashboardWidgets.length > 0 && (
            <div>
              <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-2.5 md:mb-3 uppercase tracking-wide">
                Main Dashboard Widgets
              </h3>
              <div className="space-y-2">
                {sortedMainDashboardWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    draggable
                    onDragStart={(e) => handleMainDashboardDragStart(e, widget.id)}
                    onDragOver={(e) => handleMainDashboardDragOver(e, widget.id)}
                    onDragLeave={handleMainDashboardDragLeave}
                    onDrop={(e) => handleMainDashboardDrop(e, widget.id)}
                    onDragEnd={handleMainDashboardDragEnd}
                    className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all touch-manipulation min-h-[48px] sm:min-h-0 ${
                      draggedMainDashboardId === widget.id
                        ? 'opacity-50 bg-gray-100 dark:bg-gray-700'
                        : dragOverMainDashboardId === widget.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 cursor-move flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                        {widget.name}
                      </div>
                    </div>
                    <button
                      onClick={() => onMainDashboardWidgetToggle?.(widget.id, !widget.visible)}
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
                        widget.visible
                          ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          : 'text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={widget.visible ? 'Hide widget' : 'Show widget'}
                    >
                      {widget.visible ? (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Right Sidebar Widgets */}
          <div>
            <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-2.5 md:mb-3 uppercase tracking-wide">
              Right Sidebar Widgets
            </h3>
            <div className="space-y-2">
              {sortedWidgets.map((widget) => (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, widget.id)}
                  onDragOver={(e) => handleDragOver(e, widget.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, widget.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all touch-manipulation min-h-[48px] sm:min-h-0 ${
                    draggedId === widget.id
                      ? 'opacity-50 bg-gray-100 dark:bg-gray-700'
                      : dragOverId === widget.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 cursor-move flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                      {widget.name}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleVisibility(widget.id)}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
                      widget.visible
                        ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        : 'text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={widget.visible ? 'Hide widget' : 'Show widget'}
                  >
                    {widget.visible ? (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors min-h-[44px] sm:min-h-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Default</span>
          </button>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 sm:flex-initial px-4 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[44px] sm:min-h-0"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-4 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-gradient-primary hover:bg-gradient-primary-hover rounded-lg transition-colors min-h-[44px] sm:min-h-0"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

