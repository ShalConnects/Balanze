import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { Task } from '../../types/index';
import { useTranslation } from 'react-i18next';

type Filter = 'all' | 'active' | 'completed';

interface ToDoListProps {
  renderHeader?: (showAllTasks: () => void, taskCount: number) => React.ReactNode;
}

export const ToDoList: React.FC<ToDoListProps> = ({ renderHeader }) => {
  const user = useAuthStore(s => s.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [showAllModal, setShowAllModal] = useState(false);
  const [popupFilter, setPopupFilter] = useState<Filter>('active');
  const [removingIds, setRemovingIds] = useState<string[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Fetch tasks on mount
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setTasks(data || []);
        setLoading(false);
      });
  }, [user]);

  // Add a new task
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .insert({ text: input.trim(), completed: false, user_id: user.id })
      .select()
      .single();
    if (error) setError(error.message);
    else if (data) {
      setTasks(prev => [data, ...prev]);
      setAddingId(data.id);
      setTimeout(() => setAddingId(null), 400);
      setInput('');
    }
    setLoading(false);
  };

  // Remove with animation
  const removeTask = async (id: string) => {
    setRemovingIds(ids => [...ids, id]);
    setTimeout(async () => {
      setTasks(tasks => tasks.filter(task => task.id !== id));
      setRemovingIds(ids => ids.filter(rid => rid !== id));
      await supabase.from('tasks').delete().eq('id', id);
    }, 350);
  };

  // Toggle complete
  const toggleTask = async (id: string, completed: boolean) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !completed })
      .eq('id', id)
      .select()
      .single();
    if (error) setError(error.message);
    else if (data) {
      setTasks(tasks => tasks.map(t => (t.id === id ? data : t)));
    }
    setLoading(false);
  };

  // Filter tasks for main view and modal
  const activeTasks = tasks.filter(task => !task.completed);
  const displayTasks = activeTasks.slice(0, 3);
  
  const filteredTasks = tasks.filter(task => {
    if (popupFilter === 'all') return true;
    if (popupFilter === 'active') return !task.completed;
    if (popupFilter === 'completed') return task.completed;
    return true;
  });

  return (
    <div className="w-full">
      {renderHeader?.(
        () => setShowAllModal(true),
        tasks.length
      )}

      <div className="space-y-2">
        {displayTasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all duration-300 ${
              removingIds.includes(task.id) ? 'opacity-0 transform translate-x-4' : 'opacity-100'
            } ${addingId === task.id ? 'animate-slide-in' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id, task.completed)}
                className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              />
              <span className={`text-gray-900 dark:text-white ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                {task.text}
              </span>
            </div>
            <button
              onClick={() => removeTask(task.id)}
              className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noTasksYet')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('dashboard.addFirstTask')}</p>
        </div>
      )}

      <div className="mt-4">
        <form onSubmit={addTask} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('dashboard.pressEnterToAddTask')}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* All Tasks Modal */}
      {showAllModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-[0.75rem] overflow-hidden w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.allTasks')}</h3>
                <button
                  onClick={() => setShowAllModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 mb-4">
                {['active', 'completed', 'all'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPopupFilter(filter as Filter)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      popupFilter === filter
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {t(`dashboard.${filter}`)}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id, task.completed)}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className={`text-gray-900 dark:text-white ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                        {task.text}
                      </span>
                    </div>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add to your global CSS (index.css or tailwind.config.js):
// .animate-fadein { animation: fadein 0.4s cubic-bezier(0.4,0,0.2,1) both; }
// @keyframes fadein { from { opacity: 0; transform: translateY(24px);} to { opacity: 1; transform: none; } } 

