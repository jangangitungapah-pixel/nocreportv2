import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { UiIcon } from '../../shared/ui/index.jsx';

const ToastContext = createContext(null);
let nextToastId = 1;

function toneMeta(tone) {
  if (tone === 'success') {
    return {
      icon: 'check',
      iconClass: 'bg-[var(--success-soft)] text-[var(--success-text)]',
      accentClass: 'bg-[var(--success-solid)]',
    };
  }
  if (tone === 'error') {
    return {
      icon: 'error',
      iconClass: 'bg-[var(--danger-soft)] text-[var(--danger-text)]',
      accentClass: 'bg-[var(--danger-solid)]',
    };
  }
  if (tone === 'warning') {
    return {
      icon: 'warning',
      iconClass: 'bg-[var(--warning-soft)] text-[var(--warning-text)]',
      accentClass: 'bg-[var(--warning-solid)]',
    };
  }
  return {
    icon: 'info',
    iconClass: 'bg-[var(--accent-soft)] text-[var(--accent-text)]',
    accentClass: 'bg-[var(--accent-solid)]',
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ title, message = '', tone = 'info', duration = 3200 }) => {
      const id = nextToastId;
      nextToastId += 1;
      const toast = { id, title, message, tone };
      setToasts((current) => [...current, toast]);

      const timer = window.setTimeout(() => dismissToast(id), duration);
      timersRef.current.set(id, timer);
      return id;
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ pushToast, dismissToast }), [dismissToast, pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-3 top-3 z-[80] flex w-[min(390px,calc(100vw-1.5rem))] flex-col gap-2.5 sm:right-4 sm:top-4"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const meta = toneMeta(toast.tone);
          return (
            <div
              key={toast.id}
              className="ui-toast pointer-events-auto relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] p-3.5 pr-12 shadow-[var(--shadow-lg)] backdrop-blur-2xl sm:p-4 sm:pr-12"
              data-tone={toast.tone}
            >
              <span
                className={`absolute inset-y-3 left-0 w-0.5 rounded-full ${meta.accentClass}`}
                aria-hidden="true"
              />
              <div className="flex items-start gap-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-[var(--shadow-xs)] ${meta.iconClass}`}
                  aria-hidden="true"
                >
                  <UiIcon name={meta.icon} size={17} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-bold tracking-[-0.01em] text-[var(--text-primary)]">
                    {toast.title}
                  </p>
                  {toast.message ? (
                    <p className="mt-1 text-xs font-medium leading-5 text-[var(--text-secondary)] sm:text-sm sm:leading-6">
                      {toast.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-xl border border-transparent text-[var(--text-muted)] transition-[background-color,border-color,color,transform] duration-150 hover:border-[var(--border-subtle)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:scale-95"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
              >
                <UiIcon name="close" size={16} />
              </button>
            </div>
          );
        })}
      </div>
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
