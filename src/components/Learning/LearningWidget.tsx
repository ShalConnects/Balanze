import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { CourseForm } from './CourseForm';
import {
  DASHBOARD_WIDGET_ACCORDION_BTN,
  DASHBOARD_WIDGET_BADGE,
  DASHBOARD_WIDGET_CONTENT,
  DASHBOARD_WIDGET_HEADER,
  DASHBOARD_WIDGET_HEADER_BORDER,
  DASHBOARD_WIDGET_ROW,
  DASHBOARD_WIDGET_SHELL,
  DASHBOARD_WIDGET_TITLE,
  DASHBOARD_WIDGET_VIEW_ALL,
} from '../../constants/dashboardWidget';

interface LearningWidgetProps {
  isAccordionExpanded?: boolean;
  onAccordionToggle?: () => void;
}

export const LearningWidget: React.FC<LearningWidgetProps> = ({
  isAccordionExpanded = true,
  onAccordionToggle,
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { courses, modules, loading, fetchCourses, fetchModules } = useCourseStore();
  const [showCourseForm, setShowCourseForm] = useState(false);

  useEffect(() => {
    if (user) fetchCourses();
  }, [user, fetchCourses]);

  useEffect(() => {
    courses.slice(0, 3).forEach((course) => fetchModules(course.id));
  }, [courses, fetchModules]);

  const handleViewAll = () => navigate('/personal-growth?tab=learning');

  const { displayCourses, overallProgress, courseProgress } = useMemo(() => {
    const progressByCourse = new Map<string, { completed: number; total: number; pct: number }>();
    for (const course of courses.slice(0, 3)) {
      const courseModules = modules.filter((m) => m.course_id === course.id);
      const completed = courseModules.filter((m) => m.completed).length;
      const total = courseModules.length;
      progressByCourse.set(course.id, {
        completed,
        total,
        pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    }
    const totalModules = modules.length;
    const completedModules = modules.filter((m) => m.completed).length;
    return {
      displayCourses: courses.slice(0, 3),
      overallProgress: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
      courseProgress: progressByCourse,
    };
  }, [courses, modules]);

  const accordionBtn = courses.length > 0 && onAccordionToggle && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onAccordionToggle();
      }}
      className={DASHBOARD_WIDGET_ACCORDION_BTN}
      title={isAccordionExpanded ? 'Collapse' : 'Expand'}
      aria-label={isAccordionExpanded ? 'Collapse widget' : 'Expand widget'}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {isAccordionExpanded ? (
        <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
      )}
    </button>
  );

  const header = (
    <div
      className={`${DASHBOARD_WIDGET_HEADER} ${
        isAccordionExpanded && courses.length > 0 ? DASHBOARD_WIDGET_HEADER_BORDER : ''
      }`}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <h3 className={DASHBOARD_WIDGET_TITLE}>Learning</h3>
        {courses.length > 0 && (
          <>
            <span className={`${DASHBOARD_WIDGET_BADGE} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`}>
              {courses.length} courses
            </span>
            <span className={`${DASHBOARD_WIDGET_BADGE} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`}>
              {overallProgress}%
            </span>
          </>
        )}
      </div>
      {courses.length > 0 && (
        <button type="button" onClick={handleViewAll} className={DASHBOARD_WIDGET_VIEW_ALL}>
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={DASHBOARD_WIDGET_SHELL}>
        {header}
        <div className={`${DASHBOARD_WIDGET_CONTENT} py-4 text-center text-xs text-gray-500`}>Loading...</div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <>
        <div className={DASHBOARD_WIDGET_SHELL}>
          {header}
          <div className={`${DASHBOARD_WIDGET_CONTENT} text-center py-4`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Start tracking your learning progress</p>
            <button
              onClick={() => setShowCourseForm(true)}
              className="px-3 py-1.5 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
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
    <div className={DASHBOARD_WIDGET_SHELL}>
      {accordionBtn}
      {header}
      {isAccordionExpanded && (
        <div className={DASHBOARD_WIDGET_CONTENT}>
          {displayCourses.map((course) => {
            const progress = courseProgress.get(course.id);
            return (
              <button
                key={course.id}
                type="button"
                onClick={handleViewAll}
                className={`${DASHBOARD_WIDGET_ROW} w-full text-left touch-manipulation`}
              >
                <div className="flex-1 min-w-0 py-1.5">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate leading-snug">
                    {course.name}
                  </p>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                    {progress?.completed ?? 0}/{progress?.total ?? 0} modules
                    {(progress?.pct ?? 0) > 0 && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600"> · </span>
                        {progress?.pct}%
                      </>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
          {courses.length > 3 && (
            <button
              type="button"
              onClick={handleViewAll}
              className="py-1.5 text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium"
            >
              +{courses.length - 3} more courses
            </button>
          )}
        </div>
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
