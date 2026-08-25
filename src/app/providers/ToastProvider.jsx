import { createContext, useCallback, useContext, useMemo } from 'react';
import { Toaster, toast } from 'sonner';

const ToastContext = createContext(null);

function showToast({ title, message = '', tone = 'info', duration = 3200 }) {
  const options = {
    description: message || undefined,
    duration,
  };

  if (tone === 'success') return toast.success(title, options);
  if (tone === 'error') return toast.error(title, { ...options, duration: Math.max(duration, 4800) });
  if (tone === 'warning') return toast.warning(title, options);
  return toast.info(title, options);
}

export function ToastProvider({ children }) {
  const dismissToast = useCallback((id) => {
    toast.dismiss(id);
  }, []);

  const pushToast = useCallback((payload) => showToast(payload), []);

  const value = useMemo(() => ({ pushToast, dismissToast }), [dismissToast, pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        closeButton
        visibleToasts={4}
        gap={8}
        toastOptions={{
          classNames: {
            toast:
              '!rounded-[var(--radius-panel)] !border-[var(--border-subtle)] !bg-[var(--surface-elevated)] !text-[var(--text-primary)] !shadow-[var(--shadow-lg)]',
            title: '!text-sm !font-bold !tracking-[-0.01em] !text-[var(--text-primary)]',
            description: '!text-xs !font-medium !leading-5 !text-[var(--text-secondary)]',
            closeButton:
              '!border-[var(--border-subtle)] !bg-[var(--surface-panel)] !text-[var(--text-muted)]',
          },
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.');
  }

  return context;
}
