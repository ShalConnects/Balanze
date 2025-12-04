import React, { useState } from 'react';
import { X, Target, DollarSign, Calendar, AlertCircle } from 'lucide-react';

interface SimpleInvestmentGoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: any) => void;
  loading?: boolean;
}

export const SimpleInvestmentGoalForm: React.FC<SimpleInvestmentGoalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    target_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required';
    }
    
    if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
      newErrors.target_amount = 'Target amount must be greater than 0';
    }
    
    if (formData.current_amount && parseFloat(formData.current_amount) < 0) {
      newErrors.current_amount = 'Current amount cannot be negative';
    }
    
    if (formData.target_date) {
      const targetDate = new Date(formData.target_date);
      const today = new Date();
      if (targetDate <= today) {
        newErrors.target_date = 'Target date must be in the future';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit
    onSubmit({
      ...formData,
      target_amount: parseFloat(formData.target_amount),
      current_amount: parseFloat(formData.current_amount || '0'),
      target_date: formData.target_date || null
    });
    
    // Reset form
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '0',
      target_date: '',
      priority: 'medium',
      description: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '0',
      target_date: '',
      priority: 'medium',
      description: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Add Investment Goal</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Goal Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goal Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Retirement Fund, House Down Payment"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Target Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.target_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.target_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="10000"
                />
              </div>
              {errors.target_amount && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.target_amount}
                </p>
              )}
            </div>

            {/* Current Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.current_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_amount: e.target.value }))}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.current_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
              </div>
              {errors.current_amount && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.current_amount}
                </p>
              )}
            </div>

            {/* Target Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.target_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.target_date && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.target_date}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description of your investment goal..."
              />
            </div>

            {/* Progress Preview */}
            {formData.target_amount && formData.current_amount && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress Preview</span>
                  <span className="text-sm font-medium text-gray-900">
                    {((parseFloat(formData.current_amount) / parseFloat(formData.target_amount)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((parseFloat(formData.current_amount) / parseFloat(formData.target_amount)) * 100, 100)}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                  <span>${parseFloat(formData.current_amount).toLocaleString()}</span>
                  <span>${parseFloat(formData.target_amount).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
