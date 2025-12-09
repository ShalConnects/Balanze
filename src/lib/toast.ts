import { toast } from 'sonner';

/**
 * Unified Toast System for FinTrack
 * 
 * This replaces all the complex toast configurations with a simple, 
 * consistent API that works across the entire application.
 */

// Simple toast interface that covers all use cases
export const showToast = {
  success: (message: string, options?: { duration?: number }) => {
    return toast.success(message, {
      duration: options?.duration || 3000,
    });
  },

  error: (message: string, options?: { duration?: number }) => {
    return toast.error(message, {
      duration: options?.duration || 5000,
    });
  },

  info: (message: string, options?: { duration?: number }) => {
    return toast.info(message, {
      duration: options?.duration || 4000,
    });
  },

  warning: (message: string, options?: { duration?: number }) => {
    return toast.warning(message, {
      duration: options?.duration || 4000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  // Utility functions
  dismiss: (toastId?: string | number) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  }
};

// Export individual functions for convenience
export const { success, error, info, warning, loading, dismiss } = showToast;

// Default export for easy importing
export default showToast;

