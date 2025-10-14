// Haptic feedback utility for mobile devices
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(30);
        break;
    }
  }
};

// Check if device supports haptic feedback
export const supportsHapticFeedback = () => {
  return 'vibrate' in navigator;
}; 

