import React, { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, Calendar, FileText } from 'lucide-react';
import { InvestmentTransactionInput, InvestmentAsset, Account } from '../../types/investment';
import { INVESTMENT_TRANSACTION_TYPES } from '../../types/investment';

interface InvestmentTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: InvestmentTransactionInput) => void;
  assets: InvestmentAsset[];
  accounts: Account[];
  initialData?: Partial<InvestmentTransactionInput>;
  loading?: boolean;
}

export const InvestmentTransactionForm: React.FC<InvestmentTransactionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  assets,
  accounts,
  initialData,
  loading = false
}) => {
  const [formData, setFormData] = useState<InvestmentTransactionInput>({
    account_id: '',
    asset_id: '',
    transaction_type: 'buy',
    quantity: 0,
    price_per_share: 0,
    total_amount: 0,
    fees: 0,
    currency: 'USD',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  useEffect(() => {
    // Auto-calculate total amount when quantity or price changes
    if (formData.quantity > 0 && formData.price_per_share > 0) {
      const total = (formData.quantity * formData.price_per_share) + (formData.fees || 0);
      setFormData(prev => ({ ...prev, total_amount: total }));
    }
  }, [formData.quantity, formData.price_per_share, formData.fees]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.account_id) {
      newErrors.account_id = 'Please select an account';
    }

    if (!formData.asset_id) {
      newErrors.asset_id = 'Please select an asset';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.price_per_share <= 0) {
      newErrors.price_per_share = 'Price per share must be greater than 0';
    }

    if (formData.total_amount <= 0) {
      newErrors.total_amount = 'Total amount must be greater than 0';
    }

    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Please select a transaction date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsCalculating(true);
    onSubmit(formData);
    
    // Reset form after successful submission
    setTimeout(() => {
      setFormData({
        account_id: '',
        asset_id: '',
        transaction_type: 'buy',
        quantity: 0,
        price_per_share: 0,
        total_amount: 0,
        fees: 0,
        currency: 'USD',
        transaction_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setErrors({});
      setIsCalculating(false);
      onClose();
    }, 1000);
  };

  const handleInputChange = (field: keyof InvestmentTransactionInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedAsset = assets.find(asset => asset.id === formData.asset_id);
  const selectedAccount = accounts.find(account => account.id === formData.account_id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Investment Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type *
            </label>
            <select
              value={formData.transaction_type}
              onChange={(e) => handleInputChange('transaction_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {INVESTMENT_TRANSACTION_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Account *
            </label>
            <select
              value={formData.account_id}
              onChange={(e) => handleInputChange('account_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.account_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select an account</option>
              {accounts
                .filter(account => account.type === 'investment')
                .map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
            </select>
            {errors.account_id && (
              <p className="mt-1 text-sm text-red-600">{errors.account_id}</p>
            )}
          </div>

          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset *
            </label>
            <select
              value={formData.asset_id}
              onChange={(e) => handleInputChange('asset_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.asset_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select an asset</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.symbol} - {asset.name}
                </option>
              ))}
            </select>
            {errors.asset_id && (
              <p className="mt-1 text-sm text-red-600">{errors.asset_id}</p>
            )}
          </div>

          {/* Asset Details Display */}
          {selectedAsset && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Asset Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Current Price:</span>
                  <span className="ml-2 font-medium">${selectedAsset.current_price}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Shares:</span>
                  <span className="ml-2 font-medium">{selectedAsset.total_shares.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Asset Type:</span>
                  <span className="ml-2 font-medium capitalize">{selectedAsset.asset_type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Currency:</span>
                  <span className="ml-2 font-medium">{selectedAsset.currency}</span>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.quantity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>

            {/* Price Per Share */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Per Share *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_per_share}
                onChange={(e) => handleInputChange('price_per_share', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.price_per_share ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.price_per_share && (
                <p className="mt-1 text-sm text-red-600">{errors.price_per_share}</p>
              )}
            </div>
          </div>

          {/* Fees and Total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fees
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.fees}
                onChange={(e) => handleInputChange('fees', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.total_amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                <Calculator className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              {errors.total_amount && (
                <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>
              )}
            </div>
          </div>

          {/* Currency and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Transaction Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.transaction_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              {errors.transaction_date && (
                <p className="mt-1 text-sm text-red-600">{errors.transaction_date}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <div className="relative">
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional notes about this transaction..."
              />
              <FileText className="absolute top-3 right-3 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Summary */}
          {formData.quantity > 0 && formData.price_per_share > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Transaction Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div className="flex justify-between">
                  <span>{formData.quantity} shares × ${formData.price_per_share}</span>
                  <span>${(formData.quantity * formData.price_per_share).toFixed(2)}</span>
                </div>
                {formData.fees > 0 && (
                  <div className="flex justify-between">
                    <span>Fees</span>
                    <span>${formData.fees.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t border-blue-200 pt-1">
                  <span>Total</span>
                  <span>${formData.total_amount.toFixed(2)}</span>
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
              disabled={loading || isCalculating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading || isCalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isCalculating ? 'Calculating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  Add Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};