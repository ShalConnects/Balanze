import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current device is a touch device
 * @returns boolean indicating if the device supports touch
 */
export function useTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkTouchDevice();
    
    // Re-check on resize/orientation change (for devices that can switch modes)
    window.addEventListener('resize', checkTouchDevice);
    window.addEventListener('orientationchange', checkTouchDevice);
    
    return () => {
      window.removeEventListener('resize', checkTouchDevice);
      window.removeEventListener('orientationchange', checkTouchDevice);
    };
  }, []);

  return isTouchDevice;
}

