'use client';
import { useEffect, useState } from 'react';
import { Toast, toast as toastStore } from '@/lib/toast';
import { AnimatePresence, m } from 'framer-motion';

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastStore.subscribe(setToasts);
  }, []);

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map(t => (
          <m.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-auto flex items-center gap-4 bg-[#050505] border border-[var(--color-border)] rounded-lg px-4 py-3 shadow-xl"
            onMouseEnter={() => {}} // Pausing could be added by clearing timeouts
          >
            <span className="text-[12px] tracking-wide text-[#e8e8e8] tabular-nums">{t.message}</span>
            {t.action && (
              <button 
                onClick={() => { t.action!.onClick(); toastStore.dismiss(t.id); }}
                className="text-[11px] font-medium tracking-wide uppercase text-[#898989] hover:text-[#e8e8e8] transition-colors border-l border-[var(--color-border)] pl-4"
              >
                {t.action.label}
              </button>
            )}
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}