import { useState, useEffect } from 'react';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isVerySmall, setIsVerySmall] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      // Use 768px to match Tailwind's md: breakpoint
      setIsMobile(width < 768);
      setIsVerySmall(width <= 468); // xs breakpoint
    };

    const checkBrowser = () => {
      // Detect if running in browser (not mobile app)
      const isCapacitor = window.Capacitor !== undefined;
      const isInApp = navigator.userAgent.includes('CapacitorApp');
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Browser detection: not Capacitor, not in app, not standalone
      setIsBrowser(!isCapacitor && !isInApp && !isStandalone);
    };

    checkScreenSize();
    checkBrowser();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return { isMobile, isVerySmall, isBrowser };
}; 

