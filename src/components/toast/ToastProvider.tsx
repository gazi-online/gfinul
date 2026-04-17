'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Toast, type ToastItem, type ToastVariant } from './Toast';

type AddToastInput = {
  type: ToastVariant;
  title: string;
  message: string;
};

type ToastContextValue = {
  addToast: (toast: AddToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 3000;
const EXIT_DURATION_MS = 250;

const createToastId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const activeTimer = timersRef.current.get(id);
    if (activeTimer) {
      window.clearTimeout(activeTimer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, visible: false } : toast)));

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, EXIT_DURATION_MS);
  }, []);

  const addToast = useCallback(
    ({ type, title, message }: AddToastInput) => {
      const id = createToastId();

      setToasts((current) => [...current, { id, type, title, message, visible: false }]);

      window.setTimeout(() => {
        setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, visible: true } : toast)));
      }, 10);

      const timeoutId = window.setTimeout(() => {
        dismissToast(id);
      }, TOAST_DURATION_MS);

      timersRef.current.set(id, timeoutId);
    },
    [dismissToast]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timersRef.current.clear();
    };
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[220] flex flex-col gap-3 sm:left-auto sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }

  return context;
}
