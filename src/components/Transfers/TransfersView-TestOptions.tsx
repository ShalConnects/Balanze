import React, { useState } from 'react';
import { TransfersView } from './TransfersView';

export const TransfersViewTestOptions: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState(1);

  const options = [
    { id: 1, name: 'Option 1: Search in Tab Header', description: 'Search field in the tab bar' },
    { id: 2, name: 'Option 2: Search in Table Header', description: 'Search field in dedicated header row' },
    { id: 3, name: 'Option 3: Search in Empty State', description: 'Search field appears when no transfers' },
    { id: 4, name: 'Option 4: Floating Search', description: 'Floating search button and overlay' },
    { id: 5, name: 'Option 5: Search in Cards', description: 'Small search icons in each transfer card' },
  ];

  return (
    <div className="space-y-4">
      {/* Option Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-3">Test Search Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedOption === option.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{option.name}</div>
              <div className="text-sm text-gray-600 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Option Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm text-blue-800">
          <strong>Currently testing:</strong> {options.find(opt => opt.id === selectedOption)?.name}
        </div>
      </div>

      {/* TransfersView Component */}
      <TransfersView />
    </div>
  );
}; 

