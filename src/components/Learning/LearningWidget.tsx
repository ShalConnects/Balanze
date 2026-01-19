import React, { useState, useEffect } from 'react';
import { BookOpen, ArrowRight, Plus } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { CourseForm } from './CourseForm';

interface LearningWidgetProps {
  isAccordionExpanded?: boolean;
  onAccordionToggle?: () => void;
}

export const LearningWidget: React.FC<LearningWidgetProps> = ({
  isAccordionExpanded = true,
  onAccordionToggle
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    courses,
    modules,
    loading,
    fetchCourses,
    fetchModules,
  } = useCourseStore();
  const [showCourseForm, setShowCourseForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user, fetchCourses]);

  // Fetch modules for displayed courses
  useEffect(() => {
    if (courses.length > 0) {
      courses.slice(0, 3).forEach(course => {
        fetchModules(course.id);
      });
    }
  }, [courses, fetchModules]);

  const handleViewAll = () => {
    navigate('/personal-growth?tab=learning');
  };

  // Calculate overall progress
  const calculateProgress = (courseId: string) => {
    const courseModules = modules.filter(m => m.course_id === courseId);
    if (courseModules.length === 0) return 0;
    const completed = courseModules.filter(m => m.completed).length;
    return Math.round((completed / courseModules.length) * 100);
  };

  // Show only first 3 courses in widget
  const displayCourses = courses.slice(0, 3);

  // Calculate overall stats
  const totalCourses = courses.length;
  const totalModules = modules.length;
  const completedModules = modules.filter(m => m.completed).length;
  const overallProgress = totalModules > 0 
    ? Math.round((completedModules / totalModules) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Learning</h3>
          </div>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Learning</h3>
            </div>
          </div>
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Start tracking your learning progress
            </p>
            <button
              onClick={() => setShowCourseForm(true)}
              className="px-4 py-2 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-lg text-sm font-medium flex items-center gap-2 mx-auto transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Course
            </button>
          </div>
        </div>
        {showCourseForm && (
          <CourseForm
            course={null}
            onClose={() => setShowCourseForm(false)}
            onSuccess={() => {
              setShowCourseForm(false);
              fetchCourses();
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Learning</h3>
        </div>
        <button
          onClick={handleViewAll}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      {/* Overall Stats */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-gray-600 dark:text-gray-400">Courses</div>
            <div className="font-semibold text-gray-900 dark:text-white">{totalCourses}</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Progress</div>
            <div className="font-semibold text-gray-900 dark:text-white">{overallProgress}%</div>
          </div>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="space-y-2">
        {displayCourses.map((course) => {
          const progress = calculateProgress(course.id);
          const courseModules = modules.filter(m => m.course_id === course.id);
          const completedCount = courseModules.filter(m => m.completed).length;

          return (
            <div
              key={course.id}
              className="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 transition-all hover:shadow-sm"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {course.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>{completedCount}/{courseModules.length} modules</span>
                    {progress > 0 && (
                      <>
                        <span>•</span>
                        <span>{progress}%</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {courses.length > 3 && (
        <button
          onClick={handleViewAll}
          className="w-full mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline text-center"
        >
          +{courses.length - 3} more courses
        </button>
      )}
      {showCourseForm && (
        <CourseForm
          course={null}
          onClose={() => setShowCourseForm(false)}
          onSuccess={() => {
            setShowCourseForm(false);
            fetchCourses();
          }}
        />
      )}
    </div>
  );
};
