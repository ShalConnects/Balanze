# Mobile Refresh System Guide

This document describes the unified mobile refresh system implemented for consistent pull-to-refresh functionality across all platforms.

## Overview

The mobile refresh system provides:
1. **Unified Interface** - Single system for all mobile refresh functionality
2. **Dual Mode Support** - Native browser refresh + custom PullToRefresh component
3. **Enhanced UX** - Haptic feedback, progress indicators, success states
4. **Easy Integration** - React hook for simple component integration
5. **Configurable** - Flexible configuration for different use cases

## Architecture

### Core Components

1. **AndroidScrollHandler** (`src/utils/androidScrollHandler.ts`)
   - Handles native Android browser pull-to-refresh
   - Manages scroll behavior and touch events
   - Provides cleanup and initialization

2. **PullToRefresh Component** (`src/components/PullToRefresh.tsx`)
   - Custom React component with enhanced UX
   - Haptic feedback, progress rings, success states
   - Configurable threshold and behavior

3. **UnifiedMobileRefresh** (`src/utils/unifiedMobileRefresh.ts`)
   - Coordinates between native and custom refresh
   - Provides unified configuration interface
   - Manages system state and cleanup

4. **useMobileRefresh Hook** (`src/hooks/useMobileRefresh.ts`)
   - React hook for easy integration
   - Automatic initialization and cleanup
   - Provides PullToRefresh props and control functions

## Usage

### Basic Usage

```tsx
import { useMobileRefresh } from '../hooks/useMobileRefresh';

const MyComponent = () => {
  const { pullToRefreshProps } = useMobileRefresh({
    onRefresh: async () => {
      // Your refresh logic here
      await fetchData();
    }
  });

  return (
    <div>
      <PullToRefresh {...pullToRefreshProps} />
      {/* Your component content */}
    </div>
  );
};
```

### Advanced Configuration

```tsx
import { useMobileRefresh } from '../hooks/useMobileRefresh';

const MyComponent = () => {
  const { 
    pullToRefreshProps, 
    setEnabled, 
    setHapticFeedback,
    isActive 
  } = useMobileRefresh({
    onRefresh: async () => {
      await fetchData();
    },
    enableNativeRefresh: true,    // Enable native browser refresh
    enableCustomRefresh: true,     // Enable custom PullToRefresh component
    hapticFeedback: true,         // Enable haptic feedback
    threshold: 80,                // Pull distance threshold
    disabled: false               // Disable entire system
  });

  return (
    <div>
      <PullToRefresh {...pullToRefreshProps} />
      {/* Your component content */}
    </div>
  );
};
```

### Manual Control

```tsx
import { useMobileRefresh } from '../hooks/useMobileRefresh';

const MyComponent = () => {
  const { 
    pullToRefreshProps,
    setEnabled,
    setNativeRefreshEnabled,
    setCustomRefreshEnabled,
    setHapticFeedback,
    setThreshold,
    triggerRefresh,
    isActive,
    config
  } = useMobileRefresh({
    onRefresh: async () => {
      await fetchData();
    }
  });

  const handleToggleRefresh = () => {
    setEnabled(!isActive);
  };

  const handleManualRefresh = () => {
    triggerRefresh();
  };

  return (
    <div>
      <PullToRefresh {...pullToRefreshProps} />
      <button onClick={handleToggleRefresh}>
        {isActive ? 'Disable' : 'Enable'} Refresh
      </button>
      <button onClick={handleManualRefresh}>
        Manual Refresh
      </button>
      {/* Your component content */}
    </div>
  );
};
```

## Configuration Options

### MobileRefreshConfig

```typescript
interface MobileRefreshConfig {
  enableNativeRefresh?: boolean;  // Enable native browser refresh
  enableCustomRefresh?: boolean;   // Enable custom PullToRefresh component
  hapticFeedback?: boolean;       // Enable haptic feedback
  threshold?: number;            // Pull distance threshold (default: 80)
  disabled?: boolean;            // Disable entire system
}
```

### PullToRefresh Props

```typescript
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;  // Required: refresh function
  disabled?: boolean;             // Disable component
  threshold?: number;            // Pull threshold
  hapticFeedback?: boolean;      // Enable haptic feedback
}
```

## Implementation Examples

### Page-Level Integration

```tsx
// src/pages/History.tsx
import { useMobileRefresh } from '../hooks/useMobileRefresh';
import PullToRefresh from '../components/PullToRefresh';

export const History = () => {
  const { pullToRefreshProps } = useMobileRefresh({
    onRefresh: async () => {
      await fetchLogs(true); // isRefresh = true
    }
  });

  return (
    <div className="w-full h-full p-4 bg-gray-50 dark:bg-gray-900">
      <PullToRefresh {...pullToRefreshProps} />
      {/* Rest of component */}
    </div>
  );
};
```

### Component-Level Integration

```tsx
// src/components/Dashboard/Dashboard.tsx
import { useMobileRefresh } from '../../hooks/useMobileRefresh';
import PullToRefresh from '../PullToRefresh';

export const Dashboard = () => {
  const { pullToRefreshProps } = useMobileRefresh({
    onRefresh: async () => {
      await Promise.all([
        fetchTransactions(),
        fetchAccounts(),
        fetchCategories()
      ]);
    }
  });

  return (
    <>
      <PullToRefresh {...pullToRefreshProps} />
      {/* Dashboard content */}
    </>
  );
};
```

## Features

### Enhanced UX Features

1. **Haptic Feedback**
   - Light vibration on touch start
   - Medium vibration when reaching threshold
   - Heavy vibration on refresh trigger

2. **Visual Feedback**
   - Progress ring during pull gesture
   - Scaling animation when threshold reached
   - Success state with checkmark
   - Status messages ("Release to refresh", "Refreshing...", "Refreshed!")

3. **Smart Behavior**
   - Only activates at top of page
   - Prevents conflicts with scrolling
   - Graceful error handling
   - Automatic cleanup

### Platform Support

- ✅ **Web Browsers** - Full custom refresh experience
- ✅ **Android Chrome** - Native + custom refresh
- ✅ **iOS Safari** - Custom refresh experience
- ✅ **Mobile Apps** - Custom refresh experience

## Migration Guide

### From Existing PullToRefresh Usage

**Before:**
```tsx
<PullToRefresh onRefresh={handleRefresh} />
```

**After:**
```tsx
const { pullToRefreshProps } = useMobileRefresh({
  onRefresh: handleRefresh
});

<PullToRefresh {...pullToRefreshProps} />
```

### From Manual Android Scroll Setup

**Before:**
```tsx
useEffect(() => {
  const { androidScrollHandler } = require('../utils/androidScrollHandler');
  androidScrollHandler.initialize();
  return () => androidScrollHandler.cleanup();
}, []);
```

**After:**
```tsx
const { pullToRefreshProps } = useMobileRefresh({
  onRefresh: handleRefresh
});
```

## Best Practices

1. **Use the Hook** - Always use `useMobileRefresh` hook instead of direct component usage
2. **Handle Errors** - Always wrap refresh logic in try-catch blocks
3. **Cleanup** - The hook handles cleanup automatically, but you can disable auto-initialization if needed
4. **Configuration** - Use configuration to optimize for different use cases
5. **Testing** - Test on actual mobile devices for best results

## Troubleshooting

### Common Issues

1. **Double Refresh** - Make sure you're not using both native and custom refresh simultaneously
2. **Not Working on Android** - Ensure Android scroll handler is properly initialized
3. **Haptic Feedback Not Working** - Check if device supports vibration API
4. **Performance Issues** - Consider disabling haptic feedback on low-end devices

### Debug Mode

```tsx
const { config, isActive } = useMobileRefresh({
  onRefresh: handleRefresh
});

console.log('Mobile Refresh Config:', config);
console.log('Mobile Refresh Active:', isActive);
```

## Future Enhancements

- [ ] Gesture recognition improvements
- [ ] Accessibility enhancements
- [ ] Performance optimizations
- [ ] Advanced haptic patterns
- [ ] Custom animation support
