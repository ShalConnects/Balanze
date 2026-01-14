import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { CourseModule, CourseModuleInput } from '../../types';

interface ModuleFormProps {
  courseId: string;
  module?: CourseModule | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModuleForm: React.FC<ModuleFormProps> = ({ courseId, module, onClose, onSuccess }) => {
  const { createModule, updateModule, loading } = useCourseStore();
  const [formData, setFormData] = useState<CourseModuleInput>({
    course_id: courseId,
    title: '',
    notes: '',
    completed: false,
  });

  useEffect(() => {
    if (module) {
      setFormData({
        course_id: courseId,
        title: module.title,
        notes: module.notes || '',
        completed: module.completed,
      });
    } else {
      setFormData({
        course_id: courseId,
        title: '',
        notes: '',
        completed: false,
      });
    }
  }, [module, courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (module) {
      await updateModule(module.id, formData);
    } else {
      await createModule(formData);
    }
    onSuccess();
  };

  const getInputClasses = () => {
    return "w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";
  };

  const getTextareaClasses = () => {
    return "w-full px-4 py-2 text-[14px] rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none min-h-[80px]";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {module ? 'Edit Module' : 'Create Module'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
            disabled={loading}
            aria-label="Close form"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Module Title *"
              className={getInputClasses()}
              required
              disabled={loading}
            />
          </div>

          <div>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes (optional)"
              rows={4}
              className={getTextareaClasses()}
              disabled={loading}
              maxLength={2000}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : module ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
