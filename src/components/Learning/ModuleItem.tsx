import React, { useState } from 'react';
import { CheckCircle2, Circle, Edit2, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { CourseModule } from '../../types';

interface ModuleItemProps {
  module: CourseModule;
  onEdit: () => void;
  onDelete: () => void;
}

export const ModuleItem: React.FC<ModuleItemProps> = ({ module, onEdit, onDelete }) => {
  const { toggleModuleCompletion, updateModule } = useCourseStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState(module.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleToggleComplete = async () => {
    await toggleModuleCompletion(module.id, !module.completed);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await updateModule(module.id, { notes });
    setIsEditingNotes(false);
    setIsSavingNotes(false);
  };

  const handleCancelEdit = () => {
    setNotes(module.notes || '');
    setIsEditingNotes(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Completion Toggle */}
          <button
            onClick={handleToggleComplete}
            className="mt-1 flex-shrink-0"
            title={module.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {module.completed ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="w-6 h-6 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400" />
            )}
          </button>

          {/* Module Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold text-gray-900 dark:text-white ${
                    module.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''
                  }`}
                >
                  {module.title}
                </h3>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {module.notes && !isExpanded && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <FileText className="w-4 h-4" />
                    <span>Has notes</span>
                  </div>
                )}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={onEdit}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Edit module"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Delete module"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</h4>
                </div>

                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={handleNotesChange}
                      placeholder="Add your notes for this module..."
                      rows={6}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingNotes ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {module.notes ? (
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">
                          {module.notes}
                        </p>
                        <button
                          onClick={() => setIsEditingNotes(true)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          Edit notes
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">
                          No notes yet
                        </p>
                        <button
                          onClick={() => setIsEditingNotes(true)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          Add notes
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
