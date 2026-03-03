import { useState, useCallback } from 'react';
import { triggerHapticFeedback } from '../../../utils/hapticFeedback';

const MIN_SWIPE_DISTANCE = 50;

export function useSidebarSwipe(isMobile: boolean, isOpen: boolean, onToggle: () => void) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (touchStart == null || touchEnd == null || touchStartY == null || touchEndY == null) return;
    const hDist = touchStart - touchEnd;
    const vDist = Math.abs(touchStartY - touchEndY);
    const isLeftSwipe = hDist > MIN_SWIPE_DISTANCE;
    const isHorizontal = Math.abs(hDist) > vDist;
    if (isLeftSwipe && isHorizontal && isMobile && isOpen) {
      triggerHapticFeedback('light');
      onToggle();
    }
  }, [touchStart, touchEnd, touchStartY, touchEndY, isMobile, isOpen, onToggle]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
