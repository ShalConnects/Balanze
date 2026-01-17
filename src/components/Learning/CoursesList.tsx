import React, { useState, useEffect, useRef } from 'react';
import { Plus, BookOpen, ChevronRight, Edit2, Trash2, Search, ChevronUp, ChevronDown, CheckCircle2, Circle, Eye } from 'lucide-react';
import { useCourseStore } from '../../store/useCourseStore';
import { Course, CourseModule } from '../../types';
import { CourseForm } from './CourseForm';
import { CourseDetail } from './CourseDetail';
import { ModuleForm } from './ModuleForm';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useAuthStore } from '../../store/authStore';
import { getPreference, setPreference } from '../../lib/userPreferences';
import { toast } from 'sonner';

export const CoursesList: React.FC = () => {
  const { courses, modules, loading, error, fetchCourses, fetchModules, deleteCourse, toggleModuleCompletion, updateModule, deleteModule } = useCourseStore();
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<CourseModule | null>(null);
  const { user } = useAuthStore();
  const [isLearningWidgetHidden, setIsLearningWidgetHidden] = useState(() => {
    const saved = localStorage.getItem('showLearningWidget');
    return saved !== null ? !JSON.parse(saved) : false;
  });
  const [isRestoringWidget, setIsRestoringWidget] = useState(false);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showLearningWidget' && e.newValue !== null) {
        setIsLearningWidgetHidden(!JSON.parse(e.newValue));
      }
    };

    const handleCustomStorageChange = () => {
      const saved = localStorage.getItem('showLearningWidget');
      if (saved !== null) {
        setIsLearningWidgetHidden(!JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('showLearningWidgetChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('showLearningWidgetChanged', handleCustomStorageChange);
    };
  }, []);

  // Handler to show learning widget from page
  const handleShowLearningWidgetFromPage = async () => {
    setIsRestoringWidget(true);
    try {
      localStorage.setItem('showLearningWidget', JSON.stringify(true));
      window.dispatchEvent(new CustomEvent('showLearningWidgetChanged'));
      
      if (user?.id) {
        await setPreference(user.id, 'showLearningWidget', true);
      }
      
      setIsLearningWidgetHidden(false);
      toast.success('Learning widget restored on dashboard');
    } catch (error) {
      console.error('Error restoring learning widget:', error);
      toast.error('Failed to restore widget');
    } finally {
      setIsRestoringWidget(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Fetch modules for all courses to calculate progress
  useEffect(() => {
    if (courses.length > 0) {
      courses.forEach((course) => {
        fetchModules(course.id);
      });
    }
  }, [courses, fetchModules]);

  // Auto-select first module when a course row is expanded
  useEffect(() => {
    if (expandedRows.size > 0) {
      const expandedCourseId = Array.from(expandedRows)[0];
      const courseModules = modules.filter((m) => m.course_id === expandedCourseId);
      
      // If modules exist and no module is selected, select the first one
      if (courseModules.length > 0 && !selectedModuleId) {
        // Modules are already sorted by position (ascending) from the store
        setSelectedModuleId(courseModules[0].id);
      }
    }
  }, [expandedRows, modules, selectedModuleId]);

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting functionality
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      : <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />;
  };

  // Sort filtered courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    let comparison = 0;

    switch (key) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'description':
        comparison = (a.description || '').localeCompare(b.description || '');
        break;
      case 'modules':
        const aModules = getCourseProgress(a.id).totalCount;
        const bModules = getCourseProgress(b.id).totalCount;
        comparison = aModules - bModules;
        break;
      case 'progress':
        const aProgress = getCourseProgress(a.id).progressPercentage;
        const bProgress = getCourseProgress(b.id).progressPercentage;
        comparison = aProgress - bProgress;
        break;
      default:
        return 0;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  // Helper function to get course progress
  const getCourseProgress = (courseId: string) => {
    const courseModules = modules.filter((m) => m.course_id === courseId);
    const completedCount = courseModules.filter((m) => m.completed).length;
    const totalCount = courseModules.length;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    return { completedCount, totalCount, progressPercentage };
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setShowCourseForm(true);
  };

  const handleDelete = async () => {
    if (courseToDelete) {
      await deleteCourse(courseToDelete.id);
      setCourseToDelete(null);
      if (selectedCourseId === courseToDelete.id) {
        setSelectedCourseId(null);
      }
    }
  };

  const handleFormClose = () => {
    setShowCourseForm(false);
    setEditingCourse(null);
  };

  const handleModuleFormClose = () => {
    setShowModuleForm(false);
    setEditingModule(null);
  };

  const handleDeleteModule = async () => {
    if (moduleToDelete) {
      await deleteModule(moduleToDelete.id);
      setModuleToDelete(null);
      // Clear selection if deleted module was selected
      if (selectedModuleId === moduleToDelete.id) {
        setSelectedModuleId(null);
      }
    }
  };

  // Row expansion functionality
  const toggleRowExpansion = (courseId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
        // Clear selected module when collapsing
        setSelectedModuleId(null);
      } else {
        // Clear selected module when expanding a different course
        setSelectedModuleId(null);
        newSet.clear(); // Only allow one expanded row at a time
        newSet.add(courseId);
        // Fetch modules when expanding
        fetchModules(courseId);
      }
      return newSet;
    });
  };

  const isRowExpanded = (courseId: string) => {
    return expandedRows.has(courseId);
  };

  if (selectedCourseId) {
    return (
      <CourseDetail
        courseId={selectedCourseId}
        onBack={() => setSelectedCourseId(null)}
      />
    );
  }

  return (
    <div className="max-w-full mx-auto">
      <div className="space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400 font-medium">⚠️ Error loading courses:</span>
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Unified Filters and Content */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 pb-[13px] lg:pb-0">
          {/* Filters Section */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1" style={{ marginBottom: 0 }}>
              <div>
                <div className="relative">
                  <Search className={`absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 ${searchTerm ? 'text-blue-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors ${
                      searchTerm 
                        ? 'border-blue-300 dark:border-blue-600' 
                        : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    }`}
                    style={searchTerm ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                  />
                </div>
              </div>

              <div className="flex-grow" />
              
              {/* Action Buttons in filter row */}
              <div className="hidden md:flex items-center gap-2">
                {isLearningWidgetHidden && (
                  <button
                    onClick={handleShowLearningWidgetFromPage}
                    disabled={isRestoringWidget}
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 h-8 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Show Learning Widget on Dashboard"
                    aria-label="Show Learning Widget on Dashboard"
                  >
                    {isRestoringWidget ? (
                      <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingCourse(null);
                    setShowCourseForm(true);
                  }}
                  className="bg-gradient-primary text-white px-3 py-1.5 h-8 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center space-x-1.5 text-[13px]"
                  title="Add Course"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Course</span>
                </button>
              </div>

              {/* Mobile Widget Restore and Add Course Buttons */}
              <div className="md:hidden flex items-center gap-2">
                {isLearningWidgetHidden && (
                  <button
                    onClick={handleShowLearningWidgetFromPage}
                    disabled={isRestoringWidget}
                    className="px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' }}
                    title="Show Learning Widget on Dashboard"
                    aria-label="Show Learning Widget on Dashboard"
                  >
                    {isRestoringWidget ? (
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingCourse(null);
                    setShowCourseForm(true);
                  }}
                  className="bg-gradient-primary text-white px-2 py-1.5 rounded-md hover:bg-gradient-primary-hover transition-colors flex items-center justify-center text-[13px] h-8 w-8"
                  title="Add Course"
                  aria-label="Add Course"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards - Now dynamic and after filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3">
            {(() => {
              const totalCourses = filteredCourses.length;
              const allModules = modules.filter((m) => filteredCourses.some((c) => c.id === m.course_id));
              const totalModules = allModules.length;
              const completedModules = allModules.filter((m) => m.completed).length;
              const inProgressCourses = filteredCourses.filter((course) => {
                const { completedCount, totalCount } = getCourseProgress(course.id);
                return totalCount > 0 && completedCount > 0 && completedCount < totalCount;
              }).length;
              const averageProgress = filteredCourses.length > 0
                ? Math.round(
                    filteredCourses.reduce((sum, course) => {
                      return sum + getCourseProgress(course.id).progressPercentage;
                    }, 0) / filteredCourses.length
                  )
                : 0;

              return (
                <>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                        <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{totalCourses}</p>
                        <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                          {inProgressCourses > 0 ? `${inProgressCourses} in progress` : 'No courses'}
                        </p>
                      </div>
                      <BookOpen className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Modules</p>
                        <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{totalModules}</p>
                        <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                          {completedModules} completed
                        </p>
                      </div>
                      <span className="text-blue-600" style={{ fontSize: '1.2rem' }}>#</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Completed Modules</p>
                        <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{completedModules}</p>
                        <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                          {totalModules > 0 ? `${Math.round((completedModules / totalModules) * 100)}% complete` : 'No modules'}
                        </p>
                      </div>
                      <svg className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4 -4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Average Progress</p>
                        <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{averageProgress}%</p>
                        <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                          Across all courses
                        </p>
                      </div>
                      <svg className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Content Section */}
          {loading && courses.length === 0 ? (
            <div className="p-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading courses...</p>
              </div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-12">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No courses found' : 'No courses yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Create your first course to start tracking your learning'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => {
                      setEditingCourse(null);
                      setShowCourseForm(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Course</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
              <div className="hidden lg:block max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Course Name</span>
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('modules')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Modules</span>
                          {getSortIcon('modules')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('progress')}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>Progress</span>
                          {getSortIcon('progress')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-16 text-center">
                          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <BookOpen className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {searchTerm ? 'No courses found' : 'No courses yet'}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                            {searchTerm
                              ? 'Try adjusting your search terms'
                              : 'Start tracking your learning by adding your first course'}
                          </p>
                          {!searchTerm && (
                            <button
                              onClick={() => {
                                setEditingCourse(null);
                                setShowCourseForm(true);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                              <Plus className="w-5 h-5" />
                              <span>Create Course</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      sortedCourses.map((course) => {
                        const { completedCount, totalCount, progressPercentage } = getCourseProgress(course.id);
                        return (
                          <React.Fragment key={course.id}>
                            <tr
                              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              onClick={() => toggleRowExpansion(course.id)}
                            >
                              <td className="px-6 py-[0.7rem]">
                                <div className="flex items-center">
                                  <div className="flex-1 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div 
                                        className="text-sm font-medium text-gray-900 dark:text-white relative group"
                                      >
                                        {course.name}
                                        {course.description && (
                                          <div className="absolute left-0 bottom-full mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl border border-gray-700">
                                            {course.description}
                                            <div className="absolute bottom-0 left-4 transform translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45 border-r border-b border-gray-700"></div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="ml-2">
                                    <svg 
                                      className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(course.id) ? 'rotate-90' : ''}`} 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                              </td>
                            <td className="px-6 py-[0.7rem] text-center">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {totalCount > 0 ? `${completedCount} / ${totalCount}` : '0'}
                              </div>
                              {totalCount > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {completedCount} completed
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-[0.7rem]">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                                  {progressPercentage}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-[0.7rem]">
                              <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleEdit(course)}
                                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                  title="Edit course"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setCourseToDelete(course)}
                                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                  title="Delete course"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Row Content */}
                          {isRowExpanded(course.id) && (
                            <tr className="bg-gray-50 dark:bg-gray-800">
                              <td colSpan={4} className="px-4 sm:px-6 py-4 sm:py-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-[400px] sm:h-[450px] md:h-[500px] lg:h-[350px] overflow-hidden">
                                  {/* Left Side - Modules List */}
                                  <div className="space-y-2 h-full flex flex-col min-h-0">
                                    <div className="flex items-center justify-between mb-2 flex-shrink-0 sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 pb-2 -mt-2 pt-2 -mx-2 px-2 border-b border-gray-200 dark:border-gray-700">
                                      <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Modules</h4>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingModule(null);
                                          setShowModuleForm(true);
                                        }}
                                        className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm bg-gradient-primary text-white rounded-md hover:bg-gradient-primary-hover transition-colors touch-manipulation"
                                      >
                                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">Add Module</span>
                                        <span className="sm:hidden">Add</span>
                                      </button>
                                    </div>
                                    <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0 pr-1">
                                      {(() => {
                                        const courseModules = modules.filter((m) => m.course_id === course.id);
                                        if (courseModules.length === 0) {
                                          return (
                                            <div className="text-center py-6 px-4">
                                              <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                No modules yet. Click "Add Module" to get started.
                                              </p>
                                            </div>
                                          );
                                        }
                                        return courseModules.map((module) => (
                                          <div
                                            key={module.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedModuleId(module.id === selectedModuleId ? null : module.id);
                                            }}
                                            className={`p-2.5 sm:p-3 rounded-md border cursor-pointer transition-all duration-200 touch-manipulation ${
                                              selectedModuleId === module.id
                                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-300 dark:border-blue-600 shadow-sm'
                                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm active:bg-gray-50 dark:active:bg-gray-800'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 sm:gap-3">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleModuleCompletion(module.id, !module.completed);
                                                }}
                                                className="flex-shrink-0 p-1 touch-manipulation"
                                                aria-label={module.completed ? 'Mark as incomplete' : 'Mark as complete'}
                                              >
                                                {module.completed ? (
                                                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                                                ) : (
                                                  <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400" />
                                                )}
                                              </button>
                                              <div className="flex-1 min-w-0">
                                                <div
                                                  className={`text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate ${
                                                    module.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''
                                                  }`}
                                                >
                                                  {module.title}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1 sm:gap-0.5 flex-shrink-0">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingModule(module);
                                                    setShowModuleForm(true);
                                                  }}
                                                  className="p-1.5 sm:p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors touch-manipulation active:scale-95"
                                                  title="Edit module"
                                                  aria-label="Edit module"
                                                >
                                                  <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setModuleToDelete(module);
                                                  }}
                                                  className="p-1.5 sm:p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors touch-manipulation active:scale-95"
                                                  title="Delete module"
                                                  aria-label="Delete module"
                                                >
                                                  <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ));
                                      })()}
                                    </div>
                                  </div>

                                  {/* Right Side - Notes Editor */}
                                  <div className="space-y-3 h-full flex flex-col min-h-0 mt-4 lg:mt-0">
                                    {selectedModuleId ? (
                                      <>
                                        <div className="flex items-center justify-between flex-shrink-0">
                                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Notes</h4>
                                          <ModuleNotesEditor
                                            moduleId={selectedModuleId}
                                            courseId={course.id}
                                            showStatusOnly={true}
                                          />
                                        </div>
                                        <div className="flex-1 overflow-hidden min-h-0">
                                          <ModuleNotesEditor
                                            moduleId={selectedModuleId}
                                            courseId={course.id}
                                            showEditorOnly={true}
                                          />
                                        </div>
                                      </>
                                    ) : (
                                      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 md:p-8 text-center h-full flex items-center justify-center">
                                        <div className="flex flex-col items-center">
                                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
                                          </div>
                                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                            Select a module to add or edit notes
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile/Tablet Stacked Table View */}
              <div className="lg:hidden max-h-[500px] overflow-y-auto">
                <div className="space-y-4 px-2.5">
                  {sortedCourses.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {searchTerm ? 'No courses found' : 'No courses yet'}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        {searchTerm
                          ? 'Try adjusting your search terms'
                          : 'Start tracking your learning by adding your first course'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => {
                            setEditingCourse(null);
                            setShowCourseForm(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Create Course</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    sortedCourses.map((course) => {
                      const { completedCount, totalCount, progressPercentage } = getCourseProgress(course.id);
                      return (
                        <div key={course.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          {/* Stacked Table Row */}
                          <div 
                            className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:bg-gray-100 dark:active:bg-gray-700"
                            onClick={() => toggleRowExpansion(course.id)}
                          >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                              {/* Course Name */}
                              <div className="col-span-2 md:col-span-1">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Course Name</div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {course.name}
                                  </div>
                                  <svg 
                                    className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(course.id) ? 'rotate-90' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>

                              {/* Modules */}
                              <div>
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Modules</div>
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {totalCount > 0 ? `${completedCount} / ${totalCount}` : '0'}
                                </div>
                              </div>

                              {/* Progress */}
                              <div>
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Progress</div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {progressPercentage}%
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="col-span-2 md:col-span-1">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Actions</div>
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleEdit(course)}
                                    className="p-1.5 sm:p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    title="Edit course"
                                  >
                                    <Edit2 className="w-4 h-4 sm:w-4 sm:h-4" />
                                  </button>
                                  <button
                                    onClick={() => setCourseToDelete(course)}
                                    className="p-1.5 sm:p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Delete course"
                                  >
                                    <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Additional Info Row */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div>
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Completed</div>
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {completedCount} modules
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">In Progress</div>
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {totalCount - completedCount} modules
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isRowExpanded(course.id) && (
                            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 sm:p-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-[400px] sm:h-[450px] md:h-[500px] lg:h-[350px] overflow-hidden">
                                {/* Modules List */}
                                <div className="space-y-2 h-full flex flex-col min-h-0">
                                  <div className="flex items-center justify-between mb-2 flex-shrink-0 sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 pb-2 -mt-2 pt-2 -mx-2 px-2 border-b border-gray-200 dark:border-gray-700">
                                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Modules</h4>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingModule(null);
                                        setShowModuleForm(true);
                                      }}
                                      className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm bg-gradient-primary text-white rounded-md hover:bg-gradient-primary-hover transition-colors touch-manipulation"
                                    >
                                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                      <span className="hidden sm:inline">Add Module</span>
                                      <span className="sm:hidden">Add</span>
                                    </button>
                                  </div>
                                  <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0 pr-1">
                                    {(() => {
                                      const courseModules = modules.filter((m) => m.course_id === course.id);
                                      if (courseModules.length === 0) {
                                        return (
                                          <div className="text-center py-6 px-4">
                                            <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                              No modules yet. Click "Add Module" to get started.
                                            </p>
                                          </div>
                                        );
                                      }
                                      return courseModules.map((module) => (
                                        <div
                                          key={module.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedModuleId(module.id === selectedModuleId ? null : module.id);
                                          }}
                                          className={`p-2.5 sm:p-3 rounded-md border cursor-pointer transition-all duration-200 touch-manipulation ${
                                            selectedModuleId === module.id
                                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-300 dark:border-blue-600 shadow-sm'
                                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm active:bg-gray-50 dark:active:bg-gray-800'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 sm:gap-3">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleModuleCompletion(module.id, !module.completed);
                                              }}
                                              className="flex-shrink-0 p-1 touch-manipulation"
                                              aria-label={module.completed ? 'Mark as incomplete' : 'Mark as complete'}
                                            >
                                              {module.completed ? (
                                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                                              ) : (
                                                <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400" />
                                              )}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                              <div
                                                className={`text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate ${
                                                  module.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''
                                                }`}
                                              >
                                                {module.title}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1 sm:gap-0.5 flex-shrink-0">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingModule(module);
                                                  setShowModuleForm(true);
                                                }}
                                                className="p-1.5 sm:p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors touch-manipulation active:scale-95"
                                                title="Edit module"
                                                aria-label="Edit module"
                                              >
                                                <Edit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setModuleToDelete(module);
                                                }}
                                                className="p-1.5 sm:p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors touch-manipulation active:scale-95"
                                                title="Delete module"
                                                aria-label="Delete module"
                                              >
                                                <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </div>

                                {/* Notes Editor */}
                                <div className="space-y-3 h-full flex flex-col min-h-0 mt-4 lg:mt-0">
                                  {selectedModuleId ? (
                                    <>
                                      <div className="flex items-center justify-between flex-shrink-0">
                                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Notes</h4>
                                        <ModuleNotesEditor
                                          moduleId={selectedModuleId}
                                          courseId={course.id}
                                          showStatusOnly={true}
                                        />
                                      </div>
                                      <div className="flex-1 overflow-hidden min-h-0">
                                        <ModuleNotesEditor
                                          moduleId={selectedModuleId}
                                          courseId={course.id}
                                          showEditorOnly={true}
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 md:p-8 text-center h-full flex items-center justify-center">
                                      <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                          Select a module to add or edit notes
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCourseForm && (
        <CourseForm
          course={editingCourse}
          onClose={handleFormClose}
          onSuccess={() => {
            handleFormClose();
            fetchCourses();
          }}
        />
      )}

      {courseToDelete && (
        <DeleteConfirmationModal
          isOpen={!!courseToDelete}
          onClose={() => setCourseToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Course"
          message={`Are you sure you want to delete "${courseToDelete.name}"? This will also delete all modules in this course.`}
        />
      )}

      {showModuleForm && editingModule && (
        <ModuleForm
          courseId={editingModule.course_id}
          module={editingModule}
          onClose={handleModuleFormClose}
          onSuccess={() => {
            handleModuleFormClose();
            fetchModules(editingModule.course_id);
          }}
        />
      )}
      {showModuleForm && !editingModule && expandedRows.size > 0 && (
        <ModuleForm
          courseId={Array.from(expandedRows)[0]}
          module={null}
          onClose={handleModuleFormClose}
          onSuccess={() => {
            handleModuleFormClose();
            fetchModules(Array.from(expandedRows)[0]);
          }}
        />
      )}

      {moduleToDelete && (
        <DeleteConfirmationModal
          isOpen={!!moduleToDelete}
          onClose={() => setModuleToDelete(null)}
          onConfirm={handleDeleteModule}
          title="Delete Module"
          message={`Are you sure you want to delete "${moduleToDelete.title}"?`}
        />
      )}
    </div>
  );
};

// Module Notes Editor Component
interface ModuleNotesEditorProps {
  moduleId: string;
  courseId: string;
  showStatusOnly?: boolean;
  showEditorOnly?: boolean;
}

const ModuleNotesEditor: React.FC<ModuleNotesEditorProps> = ({ moduleId, courseId, showStatusOnly = false, showEditorOnly = false }) => {
  const { modules, updateModule } = useCourseStore();
  const [ReactQuill, setReactQuill] = useState<any>(null);
  const [quillLoading, setQuillLoading] = useState(false);
  const quillRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousModuleIdRef = useRef<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');

  const module = modules.find((m) => m.id === moduleId);

  // Lazy load Quill editor
  useEffect(() => {
    if (!ReactQuill && !quillLoading) {
      setQuillLoading(true);
      Promise.all([
        import('react-quill'),
        import('react-quill/dist/quill.snow.css'),
      ]).then(([quillModule]) => {
        setReactQuill(() => quillModule.default);
        setQuillLoading(false);
      }).catch(() => {
        setQuillLoading(false);
      });
    }
  }, [ReactQuill, quillLoading]);

  // Initialize notes from module
  useEffect(() => {
    if (module) {
      const moduleIdChanged = previousModuleIdRef.current !== moduleId;
      const moduleNotes = module.notes || '';
      
      // Only reset if module changed OR if notes differ and we're not actively editing
      if (moduleIdChanged) {
        // Different module selected (or first load) - reset everything
        setNotes(moduleNotes);
        setSaveStatus('saved');
        previousModuleIdRef.current = moduleId;
      } else if (previousModuleIdRef.current === moduleId && notes !== moduleNotes && (saveStatus === 'saved' || saveStatus === 'error')) {
        // Same module, but notes updated externally and we're not editing - sync notes
        setNotes(moduleNotes);
        setSaveStatus('saved');
      }
    } else if (previousModuleIdRef.current !== null) {
      // Module not found, reset ref
      previousModuleIdRef.current = null;
    }
  }, [module, moduleId, notes, saveStatus]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save function
  const saveNotesToDatabase = async (notesContent: string) => {
    if (!module) return;
    
    try {
      setSaveStatus('saving');
      await updateModule(module.id, { notes: notesContent });
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save notes:', error);
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setSaveStatus('unsaved');
    
    // Auto-save after 2 seconds of no typing
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveNotesToDatabase(value);
    }, 2000);
  };

  const handleSaveNotes = async () => {
    if (!module) return;
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setIsSaving(true);
    await saveNotesToDatabase(notes);
    setIsSaving(false);
  };

  if (!module) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">Module not found</div>;
  }

  if (quillLoading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading editor...</p>
      </div>
    );
  }

  if (!ReactQuill) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">Failed to load editor</div>;
  }

  // Render status only
  if (showStatusOnly) {
    return (
      <div className="flex items-center gap-2">
        {saveStatus === 'saving' && (
          <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 border border-blue-600 border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2"></div>
            Saving...
          </span>
        )}
        {saveStatus === 'unsaved' && (
          <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 flex items-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 border border-blue-600 border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2"></div>
            Updating...
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-xs sm:text-sm text-red-600 dark:text-red-400">
            Save failed
          </span>
        )}
      </div>
    );
  }

  // Render editor only
  return (
    <>
      <style>{`
        .notes-editor-bottom-toolbar {
          display: flex;
          flex-direction: column;
          height: 100% !important;
        }
        .notes-editor-bottom-toolbar .ql-container {
          border: 0 !important;
          border-radius: 0 0 0.5rem 0.5rem;
          flex: 1 !important;
          overflow-y: auto !important;
        }
        .notes-editor-bottom-toolbar .ql-toolbar {
          border: 0 !important;
          border-radius: 0.5rem 0.5rem 0 0;
          padding: 0.5rem 0.75rem !important;
          background: #f9fafb !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
        }
        .dark .notes-editor-bottom-toolbar .ql-toolbar {
          background: #1f2937 !important;
        }
        .notes-editor-bottom-toolbar .ql-toolbar .ql-formats {
          margin-right: 0.75rem;
          padding-right: 0.75rem;
          border-right: 1px solid #e5e7eb;
        }
        .dark .notes-editor-bottom-toolbar .ql-toolbar .ql-formats {
          border-right-color: #374151;
        }
        .notes-editor-bottom-toolbar .ql-toolbar .ql-formats:last-child {
          margin-right: 0;
          padding-right: 0;
          border-right: none;
        }
        .notes-editor-bottom-toolbar .ql-toolbar button,
        .notes-editor-bottom-toolbar .ql-toolbar .ql-picker {
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          transition: all 0.15s ease;
        }
        .notes-editor-bottom-toolbar .ql-toolbar button:hover,
        .notes-editor-bottom-toolbar .ql-toolbar .ql-picker:hover {
          background: #f3f4f6 !important;
        }
        .dark .notes-editor-bottom-toolbar .ql-toolbar button:hover,
        .dark .notes-editor-bottom-toolbar .ql-toolbar .ql-picker:hover {
          background: #374151 !important;
        }
        .notes-editor-bottom-toolbar .ql-toolbar button.ql-active,
        .notes-editor-bottom-toolbar .ql-toolbar .ql-picker.ql-expanded {
          background: #dbeafe !important;
          color: #1e40af !important;
        }
        .dark .notes-editor-bottom-toolbar .ql-toolbar button.ql-active,
        .dark .notes-editor-bottom-toolbar .ql-toolbar .ql-picker.ql-expanded {
          background: #1e3a8a !important;
          color: #93c5fd !important;
        }
        .notes-editor-bottom-toolbar .ql-toolbar .ql-stroke {
          stroke: #4b5563 !important;
        }
        .dark .notes-editor-bottom-toolbar .ql-toolbar .ql-stroke {
          stroke: #9ca3af !important;
        }
        .notes-editor-bottom-toolbar .ql-toolbar button.ql-active .ql-stroke,
        .notes-editor-bottom-toolbar .ql-toolbar .ql-picker.ql-expanded .ql-stroke {
          stroke: #1e40af !important;
        }
        .dark .notes-editor-bottom-toolbar .ql-toolbar button.ql-active .ql-stroke,
        .dark .notes-editor-bottom-toolbar .ql-toolbar .ql-picker.ql-expanded .ql-stroke {
          stroke: #93c5fd !important;
        }
        .notes-editor-bottom-toolbar .ql-toolbar .ql-fill {
          fill: #4b5563 !important;
        }
        .dark .notes-editor-bottom-toolbar .ql-toolbar .ql-fill {
          fill: #9ca3af !important;
        }
        .notes-editor-bottom-toolbar .ql-toolbar button.ql-active .ql-fill,
        .notes-editor-bottom-toolbar .ql-toolbar .ql-picker.ql-expanded .ql-fill {
          fill: #1e40af !important;
        }
        .dark .notes-editor-bottom-toolbar .ql-toolbar button.ql-active .ql-fill,
        .dark .notes-editor-bottom-toolbar .ql-toolbar .ql-picker.ql-expanded .ql-fill {
          fill: #93c5fd !important;
        }
      `}</style>
      <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm lg:h-full lg:flex lg:flex-col">
        <ReactQuill
          ref={quillRef}
          value={notes}
          onChange={handleNotesChange}
          onBlur={() => {
            // Save on blur
            if (autoSaveTimeoutRef.current) {
              clearTimeout(autoSaveTimeoutRef.current);
            }
            if (saveStatus === 'unsaved') {
              saveNotesToDatabase(notes);
            }
          }}
          theme="snow"
          placeholder="Add your notes here..."
          modules={{
            toolbar: [
              ['bold', 'italic', 'underline'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['link'],
              ['clean']
            ],
          }}
          className="notes-editor-bottom-toolbar [&_.ql-container]:min-h-[200px] sm:[&_.ql-container]:min-h-[250px] md:[&_.ql-container]:min-h-[300px] lg:[&_.ql-container]:min-h-0 [&_.ql-container]:bg-white [&_.ql-container]:dark:bg-gray-900 [&_.ql-editor]:bg-white [&_.ql-editor]:dark:bg-gray-900 [&_.ql-editor]:text-gray-900 [&_.ql-editor]:dark:text-white [&_.ql-editor]:text-xs [&_.ql-editor]:sm:text-sm [&_.ql-editor]:px-3 [&_.ql-editor]:sm:px-4 [&_.ql-editor]:py-3 [&_.ql-editor]:sm:py-4 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:sm:min-h-[250px] [&_.ql-editor]:md:min-h-[300px] lg:[&_.ql-editor]:min-h-0"
        />
      </div>
    </>
  );
};
