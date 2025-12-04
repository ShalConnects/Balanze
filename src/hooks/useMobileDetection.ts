import { useState, useEffect } from 'react';

export const useMobileDetection = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isVerySmall, setIsVerySmall] = useState(false);
    const [isBrowser, setIsBrowser] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsVerySmall(width <= 468);
        };

        const checkBrowser = () => {
            const isCapacitor = window.Capacitor !== undefined;
            const isInApp = navigator.userAgent.includes('CapacitorApp');
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            
            setIsBrowser(!isCapacitor && !isInApp && !isStandalone);
        };

        checkScreenSize();
        checkBrowser();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return { isMobile, isVerySmall, isBrowser };
}; 

