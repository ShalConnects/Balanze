import React, { useState } from 'react';
import { X, DollarSign, TrendingUp } from 'lucide-react';
import { InvestmentAssetInput } from '../../types/investment';
import { INVESTMENT_ASSET_TYPES } from '../../types/investment';

interface InvestmentAssetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (asset: InvestmentAssetInput) => void;
  loading?: boolean;
}

export const InvestmentAssetForm: React.FC<InvestmentAssetFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState<InvestmentAssetInput>({
    account_id: '',
    symbol: '',
    name: '',
    asset_type: 'stock',
    current_price: 0,
    currency: 'USD',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.account_id) {
      newErrors.account_id = 'Please select an account';
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }

    if (formData.current_price <= 0) {
      newErrors.current_price = 'Current price must be greater than 0';
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
      account_id: '',
      symbol: '',
      name: '',
      asset_type: 'stock',
      current_price: 0,
      currency: 'USD',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof InvestmentAssetInput, value: any) => {
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
          <h2 className="text-xl font-semibold text-gray-900">Add Investment Asset</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Asset Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Type *
            </label>
            <select
              value={formData.asset_type}
              onChange={(e) => handleInputChange('asset_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {INVESTMENT_ASSET_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Symbol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symbol *
            </label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.symbol ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., AAPL, BTC, TSLA"
            />
            {errors.symbol && (
              <p className="mt-1 text-sm text-red-600">{errors.symbol}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Apple Inc., Bitcoin, Tesla Inc."
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Current Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Price *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={formData.current_price}
                onChange={(e) => handleInputChange('current_price', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.current_price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            {errors.current_price && (
              <p className="mt-1 text-sm text-red-600">{errors.current_price}</p>
            )}
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="BDT">BDT</option>
              <option value="INR">INR</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional notes about this asset..."
            />
          </div>

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
                  <TrendingUp className="w-4 h-4" />
                  Add Asset
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
