'use client';
import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';

export function ConnectivityBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(!isOnline || showRestored) && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-[#050505] border-b border-[var(--color-border)]"
          role="status"
          aria-live="polite"
        >
          <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-center gap-2">
            {!isOnline ? (
              <>
                <WifiOff size={14} className="text-[#898989]" />
                <span className="text-[12px] tracking-wide text-[#898989]">Offline · Reconnecting...</span>
              </>
            ) : (
              <>
                <Wifi size={14} className="text-[#22c55e]" />
                <span className="text-[12px] tracking-wide text-[#22c55e]">Back online</span>
              </>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}