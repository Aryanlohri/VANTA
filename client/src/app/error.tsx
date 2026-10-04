'use client';
import { useEffect } from 'react';
import { VantaMark } from '@/components/ui/VantaMark';

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
}