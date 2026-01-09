import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useClientStore } from '../../store/useClientStore';
import { Task, TaskInput } from '../../types/client';
import { Loader } from '../common/Loader';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { LazyDatePicker as DatePicker } from '../common/LazyDatePicker';
import { parseISO, format } from 'date-fns';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  clientId?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({ isOpen, onClose, task, clientId }) => {
  const { addTask, updateTask, loading, error } = useClientStore();
  const { isMobile } = useMobileDetection();
  const [formData, setFormData] = useState<TaskInput>({
    client_id: clientId || '',
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'in_progress'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ];

  const statusOptions = [
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Waiting on Client', value: 'waiting_on_client' },
    { label: 'Waiting on Me', value: 'waiting_on_me' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  useEffect(() => {
    if (task) {
      setFormData({
        client_id: task.client_id,
        title: task.title,
        description: task.description || '',
        due_date: task.due_date || '',
        priority: task.priority,
        status: task.status
      });
    } else {
      setFormData({
        client_id: clientId || '',
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        status: 'in_progress'
      });
    }
    setErrors({});
    setTouched({});
    setFormSubmitted(false);
  }, [task, clientId, isOpen]);

  const handleFieldChange = (field: keyof TaskInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: keyof TaskInput) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getInputClasses = (field: keyof TaskInput) => {
    const baseClasses = 'w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600';
    const errorClasses = errors[field] && (touched[field] || formSubmitted) ? 'border-red-500 focus:ring-red-500' : '';
    return `${baseClasses} ${errorClasses}`;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.client_id) {
      newErrors.client_id = 'Client is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);

    if (!validate()) {
      return;
    }

    try {
      if (task) {
        await updateTask(task.id, formData);
      } else {
        await addTask(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Loader isLoading={loading} message={task ? 'Updating task...' : 'Creating task...'} />
      
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-xl p-4 sm:p-6 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {task ? 'Edit Task' : 'Create Task'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg p-1.5 transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5">
            {/* Error Banner */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-7">
              {/* Title - Full Width */}
              <div className="relative">
                <input
                  id="task-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  onBlur={() => handleBlur('title')}
                  className={getInputClasses('title')}
                  placeholder="Title *"
                  disabled={loading}
                />
                {errors.title && (touched.title || formSubmitted) && (
                  <span className="text-xs text-red-600 absolute left-0 -bottom-5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.title}
                  </span>
                )}
              </div>

              {/* Description - Full Width */}
              <div className="relative">
                <textarea
                  id="task-description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleBlur('description')}
                  className={`${getInputClasses('description')} min-h-[100px] resize-y`}
                  placeholder="Description"
                  disabled={loading}
                />
              </div>

              {/* Due Date and Priority - Same Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[1.15rem] gap-y-[1.40rem]">
                <div className="relative">
                  <div className={`${getInputClasses('due_date')} flex items-center px-4 pr-[10px]`}>
                    <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <DatePicker
                      selected={formData.due_date ? parseISO(formData.due_date) : null}
                      onChange={(date) => {
                        handleFieldChange('due_date', date ? format(date, 'yyyy-MM-dd') : '');
                      }}
                      onBlur={() => handleBlur('due_date')}
                      placeholderText="Due Date"
                      dateFormat="yyyy-MM-dd"
                      className="bg-transparent outline-none border-none w-full cursor-pointer text-[14px] text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                      calendarClassName="z-[60] shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg !font-sans bg-white dark:bg-gray-800"
                      popperPlacement="bottom-start"
                      showPopperArrow={false}
                      wrapperClassName="w-full"
                      todayButton="Today"
                      highlightDates={[new Date()]}
                      isClearable
                      autoComplete="off"
                      disabled={loading}
                    />
                    {formData.due_date && (
                      <button
                        type="button"
                        className="ml-2 text-xs text-blue-600 hover:underline flex-shrink-0"
                        onClick={() => handleFieldChange('due_date', '')}
                        tabIndex={-1}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <CustomDropdown
                    options={priorityOptions}
                    value={formData.priority || 'medium'}
                    onChange={(value) => handleFieldChange('priority', value)}
                    placeholder="Priority *"
                    disabled={loading}
                    fullWidth={true}
                  />
                </div>
              </div>

              {/* Status - Full Width */}
              <div className="relative">
                <CustomDropdown
                  options={statusOptions}
                  value={formData.status || 'in_progress'}
                  onChange={(value) => handleFieldChange('status', value)}
                  placeholder="Status *"
                  disabled={loading}
                  fullWidth={true}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-gradient-primary hover:bg-gradient-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {task ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {task ? 'Update Task' : 'Create Task'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

