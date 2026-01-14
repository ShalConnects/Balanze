import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { Course, CourseModule } from '../../types';
import { ModuleForm } from './ModuleForm';
import { ModuleItem } from './ModuleItem';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

interface CourseDetailProps {
  courseId: string;
  onBack: () => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({ courseId, onBack }) => {
  const { courses, modules, loading, error, fetchCourses, fetchModules, deleteModule } = useCourseStore();
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<CourseModule | null>(null);

  const course = courses.find((c) => c.id === courseId);

  useEffect(() => {
    if (!course) {
      fetchCourses();
    }
    fetchModules(courseId);
  }, [courseId, course, fetchCourses, fetchModules]);

  const completedCount = modules.filter((m) => m.completed).length;
  const totalCount = modules.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleEdit = (module: CourseModule) => {
    setEditingModule(module);
    setShowModuleForm(true);
  };

  const handleDelete = async () => {
    if (moduleToDelete) {
      await deleteModule(moduleToDelete.id);
      setModuleToDelete(null);
    }
  };

  const handleFormClose = () => {
    setShowModuleForm(false);
    setEditingModule(null);
  };

  if (!course) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Courses</span>
        </button>

        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
                {course.name}
              </h1>
              {course.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400 font-medium">⚠️ Error loading modules:</span>
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {completedCount} / {totalCount} modules completed
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {progressPercentage}% complete
          </p>
        </div>

        {/* Modules Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Modules</h2>
            <button
              onClick={() => {
                setEditingModule(null);
                setShowModuleForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Module</span>
            </button>
          </div>

          {loading && modules.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading modules...</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No modules yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add your first module to start tracking your learning progress
          </p>
          <button
            onClick={() => {
              setEditingModule(null);
              setShowModuleForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
              <Plus className="w-5 h-5" />
              <span>Add Module</span>
            </button>
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((module) => (
                <ModuleItem
                  key={module.id}
                  module={module}
                  onEdit={() => handleEdit(module)}
                  onDelete={() => setModuleToDelete(module)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showModuleForm && (
        <ModuleForm
          courseId={courseId}
          module={editingModule}
          onClose={handleFormClose}
          onSuccess={() => {
            handleFormClose();
            fetchModules(courseId);
          }}
        />
      )}

      {moduleToDelete && (
        <DeleteConfirmationModal
          isOpen={!!moduleToDelete}
          onClose={() => setModuleToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Module"
          message={`Are you sure you want to delete "${moduleToDelete.title}"?`}
        />
      )}
    </div>
  );
};
