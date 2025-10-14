import React, { useEffect } from 'react';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { DashboardDemoOnly } from '../../pages/DashboardDemoOnly';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-7xl h-[90vh] overflow-hidden shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">🎯</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">Live Demo Dashboard</h2>
                <p className="text-blue-100 text-sm">Experience Balanze with sample data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-lg transition-colors flex-shrink-0 sm:hidden"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <button
              onClick={() => window.open('/dashboard-demo-only', '_blank')}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1 flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Open in New Tab</span>
              <span className="sm:hidden">New Tab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.href = '/register'}
              className="bg-white text-blue-600 px-3 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-1 flex-1 sm:flex-none"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-transparent border border-white/30 text-white px-3 py-2 rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm flex-1 sm:flex-none"
            >
              Back to Landing
            </button>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors flex-shrink-0 hidden sm:flex"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="h-full overflow-y-auto">
          <div className="p-4">
            <DashboardDemoOnly />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Demo</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Interactive</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Multi-Currency</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

