import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface AppInstallBannerProps {
  position?: 'top' | 'bottom';
  playStoreUrl?: string;
}

export const AppInstallBanner: React.FC<AppInstallBannerProps> = ({ 
  position = 'bottom',
  playStoreUrl = 'https://play.google.com/store/apps/details?id=com.balanze.app' // Replace with your actual app ID
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user should see the banner
    const shouldShowBanner = () => {
      // Debug logging






      // 1. CRITICAL: Check if we're inside the Capacitor app (Android app itself)
      // If we're in the app, NEVER show the banner
      const isCapacitor = !!(window as any).Capacitor;

      if (isCapacitor) {

        return false;
      }

      // 2. Check if it's Android specifically (iOS users can't install Android app)
      const isAndroid = /Android/i.test(navigator.userAgent);

      if (!isAndroid) {

        return false;
      }

      // 3. Check if user is on an actual mobile device (not desktop)
      // Use touch capability and screen size
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileScreen = window.screen.width <= 768;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      



      
      if (!isMobileDevice || !isMobileScreen) {

        return false;
      }

      // 4. Check if we're in desktop browser's mobile view (developer tools)
      // More reliable check: Linux is actually on Android devices, so only block Windows/Mac
      const isDesktopOS = /Win|Mac/i.test(navigator.platform);

      if (isDesktopOS) {

        return false;
      }

      // 5. Check if banner was dismissed recently
      const dismissedKey = `app-banner-dismissed-${position}`;
      const dismissedTime = localStorage.getItem(dismissedKey);
      if (dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);

        if (daysSinceDismissed < 7) {

          return false;
        }
      }

      // 6. Check if user is in PWA mode (standalone)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

      if (isStandalone) {

        return false;
      }


      return true;
    };

    // Show banner after 3 seconds (non-intrusive)
    if (shouldShowBanner()) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 100);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [position]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      // Store dismissal time
      const dismissedKey = `app-banner-dismissed-${position}`;
      localStorage.setItem(dismissedKey, Date.now().toString());
    }, 300);
  };

  const handleDownload = () => {
    window.open(playStoreUrl, '_blank');
    handleDismiss();
  };

  if (!isVisible) return null;

  const baseClasses = "fixed left-0 right-0 z-[9999] bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all duration-300 ease-in-out";
  
  const positionClasses = position === 'top' 
    ? `top-0 ${isAnimating ? 'translate-y-0' : '-translate-y-full'}`
    : `bottom-0 ${isAnimating ? 'translate-y-0' : 'translate-y-full'}`;

  return (
    <div className={`${baseClasses} ${positionClasses}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Icon and Text */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm sm:text-base leading-tight">
                Experience Balanze in app
              </p>
              <p className="text-xs sm:text-sm text-white/90 leading-tight mt-0.5">
                Faster • Offline • Better experience
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-white text-blue-600 hover:bg-blue-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Coming Soon</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppInstallBanner;


