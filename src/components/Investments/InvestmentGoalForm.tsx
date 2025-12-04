import React, { useState } from 'react';
import { X, Target, Calendar, DollarSign } from 'lucide-react';
import { InvestmentGoalInput } from '../../types/investment';

interface InvestmentGoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: InvestmentGoalInput) => void;
  loading?: boolean;
}

export const InvestmentGoalForm: React.FC<InvestmentGoalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState<InvestmentGoalInput>({
    name: '',
    target_amount: 0,
    current_amount: 0,
    target_date: '',
    priority: 'medium',
    status: 'active',
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required';
    }

    if (formData.target_amount <= 0) {
      newErrors.target_amount = 'Target amount must be greater than 0';
    }

    if (formData.current_amount < 0) {
      newErrors.current_amount = 'Current amount cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
    
    // Reset form
    setFormData({
      name: '',
      target_amount: 0,
      current_amount: 0,
      target_date: '',
      priority: 'medium',
      status: 'active',
      description: ''
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof InvestmentGoalInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Investment Goal</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Goal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Retirement Fund, House Down Payment"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Amount *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={formData.target_amount}
                onChange={(e) => handleInputChange('target_amount', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.target_amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            {errors.target_amount && (
              <p className="mt-1 text-sm text-red-600">{errors.target_amount}</p>
            )}
          </div>

          {/* Current Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Amount
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={formData.current_amount}
                onChange={(e) => handleInputChange('current_amount', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.current_amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            {errors.current_amount && (
              <p className="mt-1 text-sm text-red-600">{errors.current_amount}</p>
            )}
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => handleInputChange('target_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional description of your investment goal..."
            />
          </div>

          {/* Progress Preview */}
          {formData.target_amount > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Progress Preview</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{((formData.current_amount / formData.target_amount) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((formData.current_amount / formData.target_amount) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>${formData.current_amount.toFixed(2)}</span>
                  <span>${formData.target_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Add Goal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
