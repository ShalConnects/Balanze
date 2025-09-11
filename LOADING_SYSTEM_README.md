# Loading Animation System

This document describes the comprehensive loading animation system implemented across the Balanze application.

## Overview

The loading system provides three main types of animations:
1. **Global Loader Overlay** - Full-screen spinner for form submissions and data operations
2. **Skeleton Placeholders** - Animated content placeholders while data loads
3. **Loading Context** - Centralized loading state management

## Components

### 1. Loader Component (`src/components/common/Loader.tsx`)

A full-screen semi-opaque backdrop with a centered spinner.

**Features:**
- Fade in/out transitions (`transition-opacity duration-300`)
- Customizable loading message
- Dark mode support
- High z-index (z-50) to appear above all content

**Usage:**
```tsx
<Loader isLoading={isLoading} message="Saving transaction..." />
```

**When it appears:**
- Form submissions (saving transactions, updating accounts)
- Page navigation between dashboard views
- Global data refresh operations
- Any async operation wrapped with `wrapAsync()`

### 2. Skeleton Components (`src/components/common/Skeleton.tsx`)

Animated placeholder blocks that match typical content layouts.

**Available Components:**
- `Skeleton` - Basic animated block
- `SkeletonCard` - Card-shaped skeleton with multiple elements
- `SkeletonTable` - Table skeleton with header and rows
- `SkeletonChart` - Chart skeleton with bars

**Usage:**
```tsx
// Basic skeleton
<Skeleton height="h-4" width="w-full" />

// Card skeleton
<SkeletonCard className="h-48" />

// Table skeleton
<SkeletonTable rows={5} className="mb-4" />
```

**When they appear:**
- Dashboard cards while fetching data
- Transaction lists until API returns
- Account tables during loading
- Charts and analytics while data loads

### 3. Loading Context (`src/context/LoadingContext.tsx`)

Centralized loading state management using React Context.

**Features:**
- Global loading state
- Custom loading messages
- `wrapAsync()` function to automatically handle loading states
- TypeScript support

**Usage:**
```tsx
const { isLoading, wrapAsync, setLoadingMessage } = useLoadingContext();

// Wrap any async function
const handleSubmit = wrapAsync(async () => {
  setLoadingMessage('Saving data...');
  await saveData();
});
```

## Integration Examples

### 1. App.tsx Integration

The main App component is wrapped with `LoadingProvider` and displays the global loader:

```tsx
function App() {
  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
}

function AppContent() {
  const { isLoading: globalLoading, loadingMessage } = useLoadingContext();
  
  return (
    <>
      {/* Global loading overlay */}
      <Loader isLoading={globalLoading} message={loadingMessage} />
      {/* Rest of app */}
    </>
  );
}
```

### 2. Dashboard Loading States

The Dashboard component shows skeleton placeholders while data loads:

```tsx
if (loading) {
  return (
    <div className="flex">
      {/* Main Content - Skeleton Loading */}
      <div className="flex-1 pr-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
        </div>
        <SkeletonCard className="h-80" />
      </div>
      <div className="w-72 space-y-6">
        <SkeletonCard className="h-96" />
      </div>
    </div>
  );
}
```

### 3. Form Submission Loading

TransactionForm uses the loading system for form submissions:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  const wrappedSubmit = wrapAsync(async () => {
    setLoadingMessage(isEditMode ? 'Updating transaction...' : 'Saving transaction...');
    // ... form submission logic
  });
  
  await wrappedSubmit();
};
```

### 4. Account Deletion Loading

AccountsView uses loading for account operations:

```tsx
const confirmDeleteAccount = wrapAsync(async () => {
  setLoadingMessage('Deleting account...');
  await deleteAccount(accountToDelete.id, transactionId);
  // ... success handling
});
```

## Animation Triggers

### Global Loader Overlay
- **Form submissions**: Saving transactions, updating accounts, creating purchases
- **Page navigation**: Switching between dashboard views
- **Data refresh**: Manual refresh operations, initial data loading
- **Async operations**: Any function wrapped with `wrapAsync()`

### Skeleton Placeholders
- **Dashboard cards**: While fetching account balances and transaction data
- **Tables**: Transaction lists, account tables during API calls
- **Charts**: Analytics and reporting components
- **Forms**: While form data is being validated or submitted

## Implementation Details

### Loading Context Provider
- Wraps the entire application in `App.tsx`
- Provides `isLoading`, `loadingMessage`, `wrapAsync`, and `setLoading` to all components
- Manages global loading state without prop drilling

### wrapAsync Function
- Automatically sets `isLoading` to `true` before executing the async function
- Sets `isLoading` to `false` after completion (success or error)
- Preserves the original function's return type and parameters
- Handles errors gracefully

### Skeleton Components
- Use Tailwind's `animate-pulse` for smooth animations
- Match the actual content layout and dimensions
- Support dark mode with appropriate background colors
- Customizable height, width, and styling

## Best Practices

1. **Use wrapAsync for all async operations** that should show loading states
2. **Set descriptive loading messages** to inform users what's happening
3. **Show skeletons for content that takes time to load** (lists, charts, forms)
4. **Keep loading states brief** - optimize API calls and data fetching
5. **Handle errors gracefully** - loading states should clear even on errors

## File Structure

```
src/
├── components/
│   └── common/
│       ├── Loader.tsx          # Global loading overlay
│       └── Skeleton.tsx        # Skeleton placeholder components
├── context/
│   └── LoadingContext.tsx      # Loading state management
├── hooks/
│   └── useLoading.ts          # Local loading hook (alternative)
└── App.tsx                    # Main app with LoadingProvider
```

## Usage Examples

### Adding Loading to a New Component

1. Import the loading context:
```tsx
import { useLoadingContext } from '../../context/LoadingContext';
```

2. Use the loading functions:
```tsx
const { wrapAsync, setLoadingMessage } = useLoadingContext();

const handleSave = wrapAsync(async () => {
  setLoadingMessage('Saving your changes...');
  await saveData();
});
```

3. Add skeleton loading for content:
```tsx
if (loading) {
  return <SkeletonCard className="h-64" />;
}
```

### Custom Loading Messages

Set specific messages for different operations:
```tsx
setLoadingMessage('Processing payment...');     // Payment operations
setLoadingMessage('Syncing data...');          // Data sync
setLoadingMessage('Generating report...');     // Report generation
setLoadingMessage('Updating settings...');     // Settings changes
```

This loading system provides a consistent, professional user experience across the entire Balanze application while maintaining clean, maintainable code. 