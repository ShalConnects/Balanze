import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';
import { AppModal } from './AppModal';

interface AmountAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAmount: number;
  onConfirm: (newAmount: number) => void;
  currencySymbol?: string;
  label?: string;
}

export const AmountAdjustmentModal: React.FC<AmountAdjustmentModalProps> = ({
  isOpen,
  onClose,
  currentAmount,
  onConfirm,
  currencySymbol = '',
  label = 'Amount'
}) => {
  const [mode, setMode] = useState<'set' | 'adjust'>('adjust');
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('adjust');
      setInputValue('');
    }
  }, [isOpen, currentAmount]);

  // Parse input and calculate final amount
  const getCalculatedAmount = (): number | null => {
    if (!inputValue.trim()) return null;

    if (mode === 'set') {
      const parsed = parseFloat(inputValue);
      return isNaN(parsed) ? null : parsed;
    } else {
      // Adjust mode: parse for +28, -28, or plain numbers
      const trimmed = inputValue.trim();
      let adjustment = 0;
      
      if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
        adjustment = parseFloat(trimmed);
      } else {
        adjustment = parseFloat(trimmed);
      }
      
      if (isNaN(adjustment)) return null;
      const finalAmount = currentAmount + adjustment;
      return finalAmount >= 0 ? finalAmount : null;
    }
  };

  const calculatedAmount = getCalculatedAmount();
  const isValid = calculatedAmount !== null && calculatedAmount > 0;
  
  // Check if adjustment would result in negative amount
  const wouldBeNegative = mode === 'adjust' && inputValue.trim() !== '' && (() => {
    const trimmed = inputValue.trim();
    let adjustment = 0;
    if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
      adjustment = parseFloat(trimmed);
    } else {
      adjustment = parseFloat(trimmed);
    }
    return !isNaN(adjustment) && currentAmount + adjustment < 0;
  })();

  const handleQuickAdjust = (value: number) => {
    if (mode === 'adjust') {
      setInputValue(value >= 0 ? `+${value}` : `${value}`);
    } else {
      setInputValue((currentAmount + value).toString());
    }
  };

  const handleConfirm = () => {
    if (isValid && calculatedAmount !== null) {
      onConfirm(calculatedAmount);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) handleConfirm();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      zClassName="z-[100]"
      title={`Edit ${label}`}
      initialFocus={inputRef}
    >
          <div className="p-3 sm:p-4">
          {/* Current and New Amount Display */}
          <div className={`mb-3 grid gap-2 sm:gap-3 ${calculatedAmount !== null && isValid ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* Current Amount */}
            <div className="p-2.5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Current {label}</div>
              <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                {currencySymbol}{currentAmount.toFixed(2)}
              </div>
            </div>
            
            {/* New Amount Preview */}
            {calculatedAmount !== null && isValid && (
              <div className="p-2.5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">New {label}</div>
                <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  {currencySymbol}{calculatedAmount.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="mb-3">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => {
                  setMode('adjust');
                  setInputValue('');
                }}
                className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  mode === 'adjust'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Adjust {label}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('set');
                  setInputValue(currentAmount.toString());
                }}
                className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  mode === 'set'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Set {label}
              </button>
            </div>
          </div>

          {/* Input Field */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {mode === 'adjust' ? 'Enter adjustment (e.g., +28 or -28)' : `Enter new ${label.toLowerCase()}`}
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
              placeholder={mode === 'adjust' ? 'Enter +28 or -28' : '0.00'}
              autoComplete="off"
              aria-label={mode === 'adjust' ? 'Enter adjustment amount' : `Enter new ${label.toLowerCase()}`}
              aria-invalid={!isValid && inputValue.trim() !== ''}
              aria-describedby={!isValid && inputValue.trim() !== '' ? 'amount-error' : undefined}
            />
          </div>

          {/* Quick Adjustment Buttons (only in adjust mode) */}
          {mode === 'adjust' && (
            <div className="mb-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Quick adjustments:</div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(10)}
                  className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex items-center justify-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  <span>10</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(50)}
                  className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex items-center justify-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  <span>50</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(100)}
                  className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex items-center justify-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  <span>100</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(-10)}
                  className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gradient-to-br hover:from-red-50 hover:to-orange-50 dark:hover:from-red-900/20 dark:hover:to-orange-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 flex items-center justify-center gap-1 font-medium"
                >
                  <Minus className="w-3 h-3" />
                  <span>10</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {inputValue && !isValid && (
            <div id="amount-error" role="alert" className="mb-3 p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-xs text-red-600 dark:text-red-400">
                {wouldBeNegative
                  ? `Adjustment results in negative amount. Minimum is ${currencySymbol}0.00.`
                  : calculatedAmount === null
                  ? 'Invalid input. Please enter a valid number.'
                  : 'Amount must be greater than 0.'}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-row gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid}
              className="flex-1 sm:w-auto px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md disabled:hover:shadow-sm"
            >
              Confirm
            </button>
          </div>
          </div>
    </AppModal>
  );
};

