import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { StatCard } from './StatCard';
import { usePersistedToggle } from '../../hooks/usePersistedToggle';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { CourseForm } from '../Learning/CourseForm';
import { DashboardCardShell } from './DashboardCardShell';
import { learningNudge } from './DashboardCardBadge';

interface LearningSummaryCardProps {
  filterCurrency?: string;
}

export const LearningSummaryCard: React.FC<LearningSummaryCardProps> = () => {
  const { user } = useAuthStore();
  const {
    courses,
    modules,
    fetchCourses,
    fetchModules,
  } = useCourseStore();
  
  const [loading, setLoading] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);

  const [showLearningWidget, setShowLearningWidget] = usePersistedToggle(
    'showLearningWidget',
    true,
    user?.id,
    { syncFromDb: true }
  );

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchCourses();
      } catch (error) {
        console.error('Error loading learning data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, fetchCourses]);

  // Fetch modules when courses change
  useEffect(() => {
    if (courses.length > 0 && user) {
      courses.forEach(course => {
        fetchModules(course.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses.length, user]);

  // Set loading to false when we have data
  useEffect(() => {
    if (courses !== undefined) {
      setLoading(false);
    }
  }, [courses]);

  const hideLearningWidget = () => {
    setShowLearningWidget(false);
    toast.success('Preference saved!', { description: 'Learning widget hidden' });
  };

  // Calculate learning statistics
  const learningStats = useMemo(() => {
    const totalCourses = courses.length;
    const totalModules = modules.length;
    const completedModules = modules.filter(m => m.completed).length;
    const overallProgress = totalModules > 0 
      ? Math.round((completedModules / totalModules) * 100) 
      : 0;

    return {
      totalCourses,
      totalModules,
      completedModules,
      overallProgress
    };
  }, [courses, modules]);

  // Get recent courses for tooltip
  const recentCourses = useMemo(() => {
    return courses
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map(course => {
        const courseModules = modules.filter(m => m.course_id === course.id);
        const completedCount = courseModules.filter(m => m.completed).length;
        const progress = courseModules.length > 0 
          ? Math.round((completedCount / courseModules.length) * 100) 
          : 0;
        return {
          ...course,
          moduleCount: courseModules.length,
          completedCount,
          progress
        };
      });
  }, [courses, modules]);

  const learningInfoBody = useMemo(
    () => (
      <div className="space-y-2 sm:space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="min-w-0">
            <div className="mb-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">Total Courses:</div>
            <div className="break-words bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs">
              {learningStats.totalCourses} courses
            </div>
          </div>
          <div className="min-w-0">
            <div className="mb-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">Total Modules:</div>
            <div className="break-words bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs">
              {learningStats.totalModules} modules
            </div>
          </div>
        </div>
        <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
          <div className="mb-0.5 text-[11px] font-semibold text-gray-900 dark:text-gray-100 sm:text-xs">Completed Modules:</div>
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-[11px] font-medium text-transparent sm:text-xs">
            {learningStats.completedModules} / {learningStats.totalModules} ({learningStats.overallProgress}%)
          </div>
        </div>
        {recentCourses.length > 0 && (
          <>
            <div className="mt-2 border-t border-gray-200 dark:border-gray-700" />
            <div>
              <div className="mb-1">
                <div className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 sm:text-[11px]">Recent Courses</div>
              </div>
              <ul className="max-h-32 space-y-0.5 overflow-y-auto sm:max-h-40">
                {recentCourses.map((course) => (
                  <li
                    key={course.id}
                    className="flex items-center justify-between rounded py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <span className="min-w-0 flex-1 truncate text-[10px] text-gray-700 dark:text-gray-300 sm:text-[11px]" title={course.name}>
                      {course.name}
                    </span>
                    <span className="ml-2 flex-shrink-0 tabular-nums text-[10px] font-medium text-gray-900 dark:text-gray-100 sm:text-[11px]">
                      {course.completedCount}/{course.moduleCount} ({course.progress}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    ),
    [learningStats, recentCourses]
  );

  if (loading) {
    return (
      <DashboardCardShell
        title="Learning"
        viewAllTo="/personal-growth?tab=learning"
        onHide={hideLearningWidget}
        hideAriaLabel="Hide Learning widget"
        loading
      >
        {null}
      </DashboardCardShell>
    );
  }

  // Show empty state if no courses
  if (courses.length === 0) {
    // Don't render if widget is hidden
    if (!showLearningWidget) {
      return null;
    }

    return (
      <>
        <div className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm border border-blue-200/50 dark:border-blue-800/50 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[240px] gap-3 sm:gap-4 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
              No courses yet
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 px-2 max-w-xs sm:max-w-sm">
              Start tracking your learning by adding your first course
            </p>
            <button
              onClick={() => setShowCourseForm(true)}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              Add First Course
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

  // Don't render if widget is hidden
  if (!showLearningWidget) {
    return null;
  }

  return (
    <DashboardCardShell
      title="Learning"
      viewAllTo="/personal-growth?tab=learning"
      onHide={hideLearningWidget}
      hideAriaLabel="Hide Learning widget"
      info={learningInfoBody}
      infoAriaLabel="Show learning info"
      badge={learningNudge(learningStats.overallProgress)}
    >
      <div className="dashboard-stat-grid gap-3 sm:gap-4 flex-1">
        <div className="w-full">
          <StatCard
            title="Total Courses"
            value={learningStats.totalCourses.toString()}
            color="blue"
          />
        </div>
        <div className="w-full">
          <StatCard
            title="Overall Progress"
            value={`${learningStats.overallProgress}%`}
            color="purple"
          />
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
    </DashboardCardShell>
  );
};
