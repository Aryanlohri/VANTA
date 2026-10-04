const fs = require('fs');
const path = require('path');

// 1. ConnectivityBanner
const connectivity = `'use client';
import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
        <motion.div
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}`;
fs.writeFileSync('client/src/components/ui/ConnectivityBanner.tsx', connectivity);

// 2. error.tsx
const errorComponent = `'use client';
import { useEffect } from 'react';
import { VantaMark } from '@/components/ui/VantaLogo';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <VantaMark size={40} className="mb-6 opacity-40 grayscale" />
      <h2 className="text-[15px] font-semibold text-[#e8e8e8] mb-2 tracking-wide">Something went wrong</h2>
      <p className="text-[13px] text-[#616161] max-w-sm mx-auto mb-8">
        We encountered an error loading this page.
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-[#0a0a0a] border border-[var(--color-border)] rounded-md text-[13px] font-medium text-[#e8e8e8] hover:bg-white/5 transition-colors"
        >
          Try again
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(error.stack || error.message)}
          className="px-4 py-2 text-[13px] font-medium text-[#898989] hover:text-[#e8e8e8] transition-colors"
        >
          Copy error details
        </button>
      </div>
    </div>
  );
}`;
fs.writeFileSync('client/src/app/error.tsx', errorComponent);

// 3. not-found.tsx
const notFoundComponent = `import Link from 'next/link';
import { VantaMark } from '@/components/ui/VantaLogo';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <VantaMark size={40} className="mb-6 opacity-40 grayscale" />
      <h2 className="text-[15px] font-semibold text-[#e8e8e8] mb-2 tracking-wide">Page not found</h2>
      <p className="text-[13px] text-[#616161] max-w-sm mx-auto mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-[#0a0a0a] border border-[var(--color-border)] rounded-md text-[13px] font-medium text-[#e8e8e8] hover:bg-white/5 transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}`;
fs.writeFileSync('client/src/app/not-found.tsx', notFoundComponent);
