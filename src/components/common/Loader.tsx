import React from 'react';

interface LoaderProps {
  isLoading: boolean;
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ isLoading, message = 'Loading...' }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-lg transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center space-y-4">
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin"
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            <defs>
              <linearGradient id="spinner-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <path
              d="M58 32a26 26 0 1 1-52 0"
              stroke="url(#spinner-gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
        {/* Loading message */}
        <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">
          {message}
        </p>
      </div>
      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}; 

