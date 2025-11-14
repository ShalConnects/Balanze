import React from 'react';

interface LoaderProps {
  isLoading: boolean;
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ isLoading, message = 'Loading...' }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-lg transition-opacity duration-300" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 shadow-xl flex flex-col items-center justify-center w-24 h-24 sm:w-32 sm:h-32 space-y-[15px]">
          <svg
          className="animate-pulse-icon w-10 h-10 sm:w-12 sm:h-12"
          viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            <defs>
            <linearGradient id="loader-bg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#2563eb' }} />
              <stop offset="100%" style={{ stopColor: '#9333ea' }} />
              </linearGradient>
            </defs>
          <rect width="32" height="32" rx="6" fill="url(#loader-bg)" />
          <text x="16" y="22" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">B</text>
          </svg>
        <div className="flex items-center justify-center space-x-1">
          <div className="bounce-dot w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" style={{ animationDelay: '0s' }}></div>
          <div className="bounce-dot w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" style={{ animationDelay: '0.2s' }}></div>
          <div className="bounce-dot w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
      <style>{`
        .animate-pulse-icon {
          animation: pulse-icon-mobile 1.5s ease-in-out infinite;
          will-change: transform, opacity;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        @keyframes pulse-icon-mobile {
          0%, 100% { transform: scale(1) translateZ(0); opacity: 1; }
          50% { transform: scale(1.08) translateZ(0); opacity: 0.8; }
        }
        @media (min-width: 640px) {
          .animate-pulse-icon {
            animation: pulse-icon-desktop 1.5s ease-in-out infinite;
          }
        }
        @keyframes pulse-icon-desktop {
          0%, 100% { transform: scale(1) translateZ(0); opacity: 1; }
          50% { transform: scale(1.1) translateZ(0); opacity: 0.8; }
        }
        .bounce-dot {
          animation: bounce-dot-mobile 1.4s ease-in-out infinite;
          will-change: transform;
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        @keyframes bounce-dot-mobile {
          0%, 80%, 100% { transform: translateY(0) translateZ(0); }
          40% { transform: translateY(-6px) translateZ(0); }
        }
        @media (min-width: 640px) {
          .bounce-dot {
            animation: bounce-dot-desktop 1.4s ease-in-out infinite;
          }
        }
        @keyframes bounce-dot-desktop {
          0%, 80%, 100% { transform: translateY(0) translateZ(0); }
          40% { transform: translateY(-8px) translateZ(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-icon, .bounce-dot {
            animation: none;
          }
        }
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .animate-pulse-icon, .bounce-dot {
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
          }
        }
      `}</style>
    </div>
  );
}; 

