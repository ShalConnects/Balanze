import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, Info, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCourseStore } from '../../store/useCourseStore';
import { StatCard } from './StatCard';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { CourseForm } from '../Learning/CourseForm';

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
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showCrossTooltip, setShowCrossTooltip] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const { isMobile } = useMobileDetection();
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Widget visibility state - hybrid approach (localStorage + database)
  const [showLearningWidget, setShowLearningWidget] = useState(() => {
    const saved = localStorage.getItem('showLearningWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Listen for localStorage changes to sync with other pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showLearningWidget' && e.newValue !== null) {
        setShowLearningWidget(JSON.parse(e.newValue));
      }
    };

    const handleCustomStorageChange = () => {
      const saved = localStorage.getItem('showLearningWidget');
      if (saved !== null) {
        setShowLearningWidget(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('showLearningWidgetChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('showLearningWidgetChanged', handleCustomStorageChange);
    };
  }, []);

  // Load user preferences for Learning widget visibility
  useEffect(() => {
    if (user?.id) {
      const loadPreferences = async () => {
        try {
          const showWidget = await getPreference(user.id, 'showLearningWidget', true);
          setShowLearningWidget(showWidget);
          localStorage.setItem('showLearningWidget', JSON.stringify(showWidget));
        } catch (error) {
          // Keep current localStorage value if database fails
        }
      };
      loadPreferences();
    }
  }, [user?.id]);

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

  // Handle hover events for cross icon (desktop only)
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
      setShowCrossTooltip(true);
      
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowCrossTooltip(false);
      }, 1000);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      setShowCrossTooltip(false);
      
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Save Learning widget visibility preference (hybrid approach)
  const handleLearningWidgetToggle = async (show: boolean) => {
    localStorage.setItem('showLearningWidget', JSON.stringify(show));
    setShowLearningWidget(show);
    window.dispatchEvent(new CustomEvent('showLearningWidgetChanged'));
    
    if (user?.id) {
      try {
        await setPreference(user.id, 'showLearningWidget', show);
        toast.success('Preference saved!', {
          description: show ? 'Learning widget will be shown' : 'Learning widget hidden'
        });
      } catch (error) {
        toast.error('Failed to save preference', {
          description: 'Your preference will be saved locally only'
        });
      }
    } else {
      toast.info('Preference saved locally', {
        description: 'Sign in to sync preferences across devices'
      });
    }
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

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm border border-blue-200/50 dark:border-blue-800/50 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
          <div className="w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            </div>
          </div>
          <div className="w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
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
    <div 
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative h-full flex flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hide button - hover on desktop, always visible on mobile */}
      {(isHovered || isMobile) && (
        <button
          onClick={() => handleLearningWidgetToggle(false)}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          aria-label="Hide Learning widget"
        >
          <X className="w-4 h-4" />
          {/* Tooltip - only on desktop */}
          {showCrossTooltip && !isMobile && (
            <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap z-20">
              Click to hide this widget
              <div className="absolute -bottom-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
            </div>
          )}
        </button>
      )}
      
      {/* Header - Responsive layout */}
      <div className="flex items-center justify-between mb-2 pr-8">
        {/* Left side - Info button */}
        <div className="flex items-center gap-2 flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Learning</h2>
          <div className="relative flex items-center">
            <button
              type="button"
              className="ml-1 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95"
              onMouseEnter={() => !isMobile && setShowTooltip(true)}
              onMouseLeave={() => !isMobile && setShowTooltip(false)}
              onFocus={() => !isMobile && setShowTooltip(true)}
              onBlur={() => !isMobile && setShowTooltip(false)}
              onClick={() => {
                if (isMobile) {
                  setShowMobileModal(true);
                } else {
                  setShowTooltip(v => !v);
                }
              }}
              tabIndex={0}
              aria-label="Show learning info"
            >
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200" />
            </button>
            {showTooltip && !isMobile && (
              <div className="absolute left-1/2 top-full z-50 mt-2 w-72 sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-3 sm:p-4 text-xs text-gray-700 dark:text-gray-200 animate-fadein">
                <div className="space-y-2 sm:space-y-3">
                  {/* Learning Stats - Side by Side */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* Total Courses */}
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5 truncate">Total Courses:</div>
                      <div className="font-medium text-[11px] sm:text-xs bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent break-words">
                        {learningStats.totalCourses} courses
                      </div>
                    </div>

                    {/* Total Modules */}
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5 truncate">Total Modules:</div>
                      <div className="font-medium text-[11px] sm:text-xs bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent break-words">
                        {learningStats.totalModules} modules
                      </div>
                    </div>
                  </div>

                  {/* Completed Modules */}
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-0.5">Completed Modules:</div>
                    <div className="font-medium text-[11px] sm:text-xs bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {learningStats.completedModules} / {learningStats.totalModules} ({learningStats.overallProgress}%)
                    </div>
                  </div>

                  {/* Recent Courses */}
                  {recentCourses.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 mt-2"></div>
                      <div>
                        <div className="mb-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-[10px] sm:text-[11px]">Recent Courses</div>
                        </div>
                        <ul className="space-y-0.5 max-h-32 sm:max-h-40 overflow-y-auto">
                          {recentCourses.map((course) => (
                            <li key={course.id} className="flex items-center justify-between rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors py-0.5">
                              <span className="truncate flex-1 text-[10px] sm:text-[11px] text-gray-700 dark:text-gray-300 min-w-0" title={course.name}>{course.name}</span>
                              <span className="ml-2 tabular-nums font-medium text-[10px] sm:text-[11px] text-gray-900 dark:text-gray-100 flex-shrink-0">
                                {course.completedCount}/{course.moduleCount} ({course.progress}%)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Controls */}
        <div className="flex items-center gap-3">
          <Link 
            to="/personal-growth?tab=learning" 
            className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200 whitespace-nowrap"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 flex-1">
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

      {/* Mobile Modal for Learning Info */}
      {showMobileModal && isMobile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 sm:p-4 w-[90vw] sm:w-80 md:w-96 max-w-md animate-fadein">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-200">Learning Info</div>
              <button
                onClick={() => setShowMobileModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-2 touch-manipulation"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Learning Stats - Side by Side */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Total Courses */}
                <div>
                  <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-1">Total Courses:</div>
                  <div className="font-medium text-sm sm:text-base text-blue-600 dark:text-blue-400">
                    {learningStats.totalCourses}
                  </div>
                </div>
                {/* Total Modules */}
                <div>
                  <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-1">Total Modules:</div>
                  <div className="font-medium text-sm sm:text-base text-green-600 dark:text-green-400">
                    {learningStats.totalModules}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="font-semibold text-[11px] sm:text-xs text-gray-900 dark:text-gray-100 mb-1">Completed Modules:</div>
                <div className="font-medium text-sm sm:text-base text-purple-600 dark:text-purple-400">
                  {learningStats.completedModules} / {learningStats.totalModules} ({learningStats.overallProgress}%)
                </div>
              </div>

              {/* Recent Courses */}
              {recentCourses.length > 0 && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-3"></div>
                  <div>
                    <div className="mb-1">
                      <div className="font-semibold text-[10px] sm:text-xs text-gray-900 dark:text-gray-100">Recent Courses</div>
                    </div>
                    <ul className="space-y-1 max-h-32 sm:max-h-40 overflow-y-auto">
                      {recentCourses.map((course) => (
                        <li key={course.id} className="flex items-center justify-between rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors py-0.5">
                          <span className="truncate flex-1 text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 min-w-0" title={course.name}>{course.name}</span>
                          <span className="ml-2 tabular-nums font-medium text-[10px] sm:text-xs text-gray-900 dark:text-gray-100 flex-shrink-0">
                            {course.completedCount}/{course.moduleCount} ({course.progress}%)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
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
