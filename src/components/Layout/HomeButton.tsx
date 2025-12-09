import React from 'react';
import { Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useMobileSidebar } from '../../context/MobileSidebarContext';

export const HomeButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isBrowser } = useMobileDetection();
  const { isMobileSidebarOpen } = useMobileSidebar();
  // Detect Android for proper bottom offset
  const isAndroid = typeof window !== 'undefined' && /Android/i.test(navigator.userAgent);

  const handleHomeClick = () => {
    // If we're on the demo page, close the tab instead of navigating
    if (location.pathname === '/dashboard-demo-only') {
      window.close();
    } else {
      navigate('/');
    }
  };

  return (
    <div 
      className={`fixed right-6 z-50 flex flex-col items-end ${isMobile && isMobileSidebarOpen ? 'hidden' : ''}`}
      style={{ 
        bottom: isAndroid && !isBrowser
          ? `max(3.5rem, calc(3.5rem + env(safe-area-inset-bottom, 0px)))`
          : `max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom, 0px)))`
      }}
    >
      <div className="relative flex flex-col items-end">
        {/* Home Button */}
        <button
          onClick={handleHomeClick}
          className="text-white p-3.5 rounded-full shadow-lg bg-gradient-primary hover:bg-gradient-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus-ring-gradient"
          aria-label="Go to Dashboard"
          title="Go to Dashboard"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

