import { toast } from 'sonner';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

type ShowToastApi = {
  (message: string, kind?: ToastKind): string | number;
  success: (message: string, options?: { duration?: number }) => string | number;
  error: (message: string, options?: { duration?: number }) => string | number;
  info: (message: string, options?: { duration?: number }) => string | number;
  warning: (message: string, options?: { duration?: number }) => string | number;
  loading: (message: string) => string | number;
  dismiss: (toastId?: string | number) => void;
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => ReturnType<typeof toast.promise>;
};

/** Unified toast API — prefer `showToast.success(...)`; callable form kept for legacy call sites. */
export const showToast: ShowToastApi = Object.assign(
  (message: string, kind: ToastKind = 'info') => toast[kind](message),
  {
    success: (message: string, options?: { duration?: number }) =>
      toast.success(message, { duration: options?.duration ?? 3000 }),
    error: (message: string, options?: { duration?: number }) =>
      toast.error(message, { duration: options?.duration ?? 5000 }),
    info: (message: string, options?: { duration?: number }) =>
      toast.info(message, { duration: options?.duration ?? 4000 }),
    warning: (message: string, options?: { duration?: number }) =>
      toast.warning(message, { duration: options?.duration ?? 4000 }),
    loading: (message: string) => toast.loading(message),
    dismiss: (toastId?: string | number) => (toastId != null ? toast.dismiss(toastId) : toast.dismiss()),
    promise: <T,>(
      promise: Promise<T>,
      messages: { loading: string; success: string; error: string }
    ) => toast.promise(promise, messages),
  }
);

export const { success, error, info, warning, loading, dismiss } = showToast;
export default showToast;

