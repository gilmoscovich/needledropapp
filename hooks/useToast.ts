// hooks/useToast.ts
import { useState, useCallback, useRef } from 'react';
import { ToastType } from '@/types';

export interface ToastMessage {
  id:      number;
  message: string;
  type:    ToastType;
}

export function useToast() {
  const [toast,  setToast]  = useState<ToastMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'default') => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setToast({ id: Date.now(), message, type });

    timerRef.current = setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}
