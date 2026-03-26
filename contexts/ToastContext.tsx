// contexts/ToastContext.tsx
import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';
import { ToastType } from '@/types';

interface ToastMessage {
  id:      number;
  message: string;
  type:    ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  toast:     ToastMessage | null;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  toast:     null,
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast,  setToast]  = useState<ToastMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'default') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ id: Date.now(), message, type });
    timerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToastContext = () => useContext(ToastContext);
