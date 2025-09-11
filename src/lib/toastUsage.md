# Enhanced Toast Notification System

## Overview

This enhanced toast notification system provides a unified, customizable, and context-aware notification experience for the Balanze application. It replaces the inconsistent use of different toast libraries with a single, powerful system.

## Features

### 🎨 **Enhanced Styling**
- Custom themes for light and dark modes
- Consistent styling across all notifications
- Better visual hierarchy with improved typography
- Smooth animations and transitions

### 🧠 **Smart Queue Management**
- Prevents notification spam
- Priority-based queuing
- Staggered timing to avoid overwhelming users
- Duplicate detection

### 🎯 **Context-Aware Notifications**
- Pre-built notification templates for common operations
- Financial-specific notifications with proper currency formatting
- Error handling with user-friendly messages
- Loading states for async operations

### ⚡ **Performance Optimized**
- Efficient queue processing
- Minimal re-renders
- Optimized for mobile devices

## Usage Examples

### Basic Usage

```typescript
import { contextToasts } from '../lib/toastConfig';

// Success notification
contextToasts.financial.accountCreated('Savings Account');

// Error notification
contextToasts.errors.networkError();

// Loading state
const loadingToast = contextToasts.loading.saving();
// ... do async work ...
loadingToast.dismiss();
```

### Advanced Usage

```typescript
import { enhancedToast } from '../lib/toastConfig';

// Custom notification with action button
enhancedToast.success('Transaction completed', {
  description: 'Your payment has been processed',
  action: {
    label: 'View Details',
    onClick: () => navigate('/transactions')
  },
  duration: 6000,
  position: 'top-center'
});

// Promise-based toast
enhancedToast.promise(
  saveTransaction(data),
  {
    loading: 'Saving transaction...',
    success: 'Transaction saved successfully',
    error: 'Failed to save transaction'
  }
);
```

### Queue Management

```typescript
import { toastQueue } from '../lib/toastConfig';

// Add multiple notifications with priority
toastQueue.add('success', 'Account created', 'Savings account added', 3);
toastQueue.add('info', 'Balance updated', 'New balance: $1,000', 2);
toastQueue.add('warning', 'Low balance', 'Account balance is below threshold', 1);

// Clear all toasts
toastQueue.clear();
```

## Available Context Toasts

### Financial Operations
- `contextToasts.financial.transactionCreated(amount, currency)`
- `contextToasts.financial.transactionUpdated(amount, currency)`
- `contextToasts.financial.transactionDeleted()`
- `contextToasts.financial.transferSuccessful(amount, currency)`
- `contextToasts.financial.accountCreated(name)`
- `contextToasts.financial.accountUpdated(name)`
- `contextToasts.financial.accountDeleted(name)`

### Purchase Operations
- `contextToasts.purchase.itemAdded(itemName)`
- `contextToasts.purchase.itemUpdated(itemName)`
- `contextToasts.purchase.itemCompleted(itemName)`
- `contextToasts.purchase.itemDeleted(itemName)`

### Error Handling
- `contextToasts.errors.networkError()`
- `contextToasts.errors.serverError()`
- `contextToasts.errors.validationError(field)`
- `contextToasts.errors.permissionError()`

### Loading States
- `contextToasts.loading.saving()`
- `contextToasts.loading.loading()`
- `contextToasts.loading.processing()`
- `contextToasts.loading.uploading()`
- `contextToasts.loading.deleting()`

## Configuration Options

### Toast Positions
- `top-left`
- `top-center`
- `top-right` (default)
- `bottom-left`
- `bottom-center`
- `bottom-right`

### Duration Presets
- `short`: 2000ms
- `normal`: 4000ms (default)
- `long`: 6000ms
- `persistent`: Infinite (for loading states)

### Theme Support
- Light theme (default)
- Dark theme support
- Custom styling per notification type

## Migration Guide

### From React Hot Toast
```typescript
// Old
import toast from 'react-hot-toast';
toast.success('Success message');

// New
import { contextToasts } from '../lib/toastConfig';
contextToasts.general.success('Success message');
```

### From Sonner
```typescript
// Old
import { toast } from 'sonner';
toast.success('Success message');

// New
import { contextToasts } from '../lib/toastConfig';
contextToasts.general.success('Success message');
```

## Best Practices

1. **Use Context-Specific Toasts**: Instead of generic messages, use the pre-built context toasts for better user experience.

2. **Handle Loading States**: Always show loading states for async operations and dismiss them appropriately.

3. **Queue Multiple Notifications**: Use the queue system when showing multiple notifications to prevent spam.

4. **Provide Action Buttons**: Add action buttons for important notifications that require user interaction.

5. **Use Appropriate Durations**: 
   - Short for quick confirmations
   - Normal for most operations
   - Long for important errors
   - Persistent for loading states

6. **Error Handling**: Always provide meaningful error messages with context.

## Customization

### Adding New Context Toasts
```typescript
// In toastConfig.ts
export const contextToasts = {
  // ... existing contexts
  custom: {
    newFeature: (param: string) =>
      enhancedToast.success('New Feature', {
        description: `Feature: ${param}`
      })
  }
};
```

### Custom Themes
```typescript
// In toastConfig.ts
const customTheme = {
  success: {
    background: '#your-color',
    color: 'white',
    border: '1px solid #your-border-color'
  }
};
```

## Performance Considerations

- The queue system prevents notification spam
- Notifications are automatically cleaned up
- Minimal memory footprint
- Optimized for mobile devices
- Efficient re-rendering

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- High contrast support
- Focus management 