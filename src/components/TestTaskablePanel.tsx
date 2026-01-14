/**
 * Test Component for Unified Taskable Store
 * 
 * This component demonstrates the unified taskable functionality.
 * Access it at /test-taskable (when logged in)
 */

import React, { useState, useEffect } from 'react';
import { useTaskableStore } from '../store/useTaskableStore';
import type { 
  Taskable, 
  TaskableType, 
  TaskableInput,
  TaskableStandaloneTaskInput,
  TaskableClientTaskInput,
  TaskableHabitInput,
  TaskableCourseModuleInput,
} from '../types/taskable';
import { useClientStore } from '../store/useClientStore';
import { useCourseStore } from '../store/useCourseStore';
import { CheckCircle2, Circle, Clock, AlertCircle, X, Plus, RefreshCw } from 'lucide-react';

export const TestTaskablePanel: React.FC = () => {
  const {
    fetchAllTaskables,
    fetchStandaloneTasks,
    fetchClientTasks,
    fetchHabits,
    fetchCourseModules,
    addTaskable,
    updateTaskable,
    deleteTaskable,
    loading,
    error,
    clearError,
  } = useTaskableStore();

  const { clients, fetchClients } = useClientStore();
  const { courses, fetchCourses } = useCourseStore();

  const [taskables, setTaskables] = useState<Taskable[]>([]);
  const [selectedType, setSelectedType] = useState<TaskableType | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskable, setNewTaskable] = useState<Partial<TaskableInput>>({
    title: '',
    description: '',
  });

  useEffect(() => {
    loadTaskables();
    // Load clients and courses for the add form
    fetchClients();
    fetchCourses();
  }, []);

  const loadTaskables = async () => {
    let result: Taskable[] = [];
    switch (selectedType) {
      case 'all':
        result = await fetchAllTaskables();
        break;
      case 'standalone_task':
        result = await fetchStandaloneTasks();
        break;
      case 'client_task':
        result = await fetchClientTasks();
        break;
      case 'habit':
        result = await fetchHabits();
        break;
      case 'course_module':
        result = await fetchCourseModules();
        break;
    }
    setTaskables(result);
  };

  useEffect(() => {
    loadTaskables();
  }, [selectedType]);

  const handleAdd = async () => {
    if (!newTaskable.title?.trim()) {
      alert('Title is required');
      return;
    }

    // Set required fields based on type
    let input: TaskableInput;
    
    if (newTaskable.type === 'client_task') {
      const clientId = (newTaskable as any).client_id || clients[0]?.id;
      if (!clientId) {
        alert('Please select a client');
        return;
      }
      input = {
        type: 'client_task',
        title: newTaskable.title!,
        description: newTaskable.description,
        position: newTaskable.position,
        client_id: clientId,
      } as TaskableClientTaskInput;
    } else if (newTaskable.type === 'course_module') {
      const courseId = (newTaskable as any).course_id || courses[0]?.id;
      if (!courseId) {
        alert('Please select a course');
        return;
      }
      input = {
        type: 'course_module',
        title: newTaskable.title!,
        description: newTaskable.description,
        position: newTaskable.position,
        course_id: courseId,
        completed: false,
      } as TaskableCourseModuleInput;
    } else if (newTaskable.type === 'standalone_task') {
      input = {
        type: 'standalone_task',
        title: newTaskable.title!,
        text: newTaskable.title!,
        description: newTaskable.description,
        position: newTaskable.position,
        completed: false,
      } as TaskableStandaloneTaskInput;
    } else if (newTaskable.type === 'habit') {
      input = {
        type: 'habit',
        title: newTaskable.title!,
        description: newTaskable.description,
        position: newTaskable.position,
        color: 'blue',
      } as TaskableHabitInput;
    } else {
      alert('Please select a type');
      return;
    }

    const result = await addTaskable(input);
    if (result) {
      setShowAddForm(false);
      setNewTaskable({ title: '', description: '' });
      loadTaskables();
    }
  };

  const handleDelete = async (id: string, type: TaskableType) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteTaskable(id, type);
      loadTaskables();
    }
  };

  const getTypeColor = (type: TaskableType) => {
    switch (type) {
      case 'standalone_task':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'client_task':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'habit':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'course_module':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  const getCompletionStatus = (taskable: Taskable) => {
    switch (taskable.type) {
      case 'standalone_task':
        return taskable.completed;
      case 'client_task':
        return taskable.status === 'completed';
      case 'habit':
        return false; // Habits track completion separately
      case 'course_module':
        return taskable.completed;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Unified Taskable Store Test
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Test the unified interface for all task types: Standalone Tasks, Client Tasks, Habits, and Course Modules
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadTaskables}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['all', 'standalone_task', 'client_task', 'habit', 'course_module'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'all' ? 'All Types' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add New Taskable</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newTaskable.type || ''}
                    onChange={(e) => setNewTaskable({ ...newTaskable, type: e.target.value as TaskableType })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select type...</option>
                    <option value="standalone_task">Standalone Task</option>
                    <option value="client_task">Client Task</option>
                    <option value="habit">Habit</option>
                    <option value="course_module">Course Module</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTaskable.title || ''}
                    onChange={(e) => setNewTaskable({ ...newTaskable, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newTaskable.description || ''}
                    onChange={(e) => setNewTaskable({ ...newTaskable, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter description..."
                    rows={3}
                  />
                </div>
                {newTaskable.type === 'client_task' && clients.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Client
                    </label>
                    <select
                      value={(newTaskable as any).client_id || ''}
                      onChange={(e) => setNewTaskable({ ...newTaskable, client_id: e.target.value } as any)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Select client...</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {newTaskable.type === 'course_module' && courses.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Course
                    </label>
                    <select
                      value={(newTaskable as any).course_id || ''}
                      onChange={(e) => setNewTaskable({ ...newTaskable, course_id: e.target.value } as any)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Select course...</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={loading || !newTaskable.type || !newTaskable.title?.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTaskable({ title: '', description: '' });
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Taskables List */}
          <div className="space-y-4">
            {loading && taskables.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Loading...</p>
              </div>
            ) : taskables.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>No taskables found. Try adding one!</p>
              </div>
            ) : (
              taskables.map((taskable) => (
                <div
                  key={`${taskable.type}-${taskable.id}`}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${getTypeColor(taskable.type)}`}
                        >
                          {taskable.type.replace('_', ' ')}
                        </span>
                        {getCompletionStatus(taskable) ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {taskable.title}
                        </h3>
                      </div>
                      {taskable.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{taskable.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>ID: {taskable.id.slice(0, 8)}...</span>
                        {taskable.type === 'client_task' && (
                          <>
                            <span>• Status: {taskable.status}</span>
                            {taskable.priority && <span>• Priority: {taskable.priority}</span>}
                          </>
                        )}
                        {taskable.type === 'habit' && taskable.color && (
                          <span>• Color: {taskable.color}</span>
                        )}
                        {taskable.type === 'course_module' && (
                          <span>• Completed: {taskable.completed ? 'Yes' : 'No'}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(taskable.id, taskable.type)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {taskables.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {taskables.filter(t => t.type === 'standalone_task').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Standalone Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {taskables.filter(t => t.type === 'client_task').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Client Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {taskables.filter(t => t.type === 'habit').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Habits</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
