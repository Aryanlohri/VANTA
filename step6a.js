const fs = require('fs');

// 1. LiveTabManager.tsx
const liveTab = `'use client';
import { useEffect, useRef } from 'react';
import { reviewApi } from '@/lib/api';

export function LiveTabManager({ hasActiveReviews, hasCompletedReview }: { hasActiveReviews: boolean, hasCompletedReview: boolean }) {
  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : 'VANTA');
  
  useEffect(() => {
    if (!hasActiveReviews && !hasCompletedReview) {
      document.title = originalTitle.current;
      changeFavicon('/favicon.ico');
      return;
    }

    if (hasActiveReviews) {
      document.title = 'Reviewing... · VANTA';
      changeFavicon(createCanvasFavicon('active'));
    } else if (hasCompletedReview) {
      document.title = 'Review complete · VANTA';
      changeFavicon(createCanvasFavicon('complete'));
      const t = setTimeout(() => {
        document.title = originalTitle.current;
        changeFavicon('/favicon.ico');
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [hasActiveReviews, hasCompletedReview]);

  return null;
}

function changeFavicon(src: string) {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = src;
}

function createCanvasFavicon(state: 'active' | 'complete'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '/favicon.ico';

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 32, 32);

  if (state === 'active') {
    // Just a simple metallic V
    ctx.strokeStyle = '#b4b4b4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(16, 24);
    ctx.lineTo(24, 8);
    ctx.stroke();
    // pulsing dot
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(16, 28, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Checkmark
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, 16);
    ctx.lineTo(14, 22);
    ctx.lineTo(24, 10);
    ctx.stroke();
  }
  return canvas.toDataURL();
}
`;
fs.writeFileSync('client/src/components/ui/LiveTabManager.tsx', liveTab);

// 2. Shortcut Sheet
const shortcuts = `'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ShortcutSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let gPressed = false;
    let gTimeout: any;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        router.push('/dashboard/reviews/new');
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      } else if (e.key.toLowerCase() === 'g') {
        gPressed = true;
        clearTimeout(gTimeout);
        gTimeout = setTimeout(() => { gPressed = false; }, 1000);
      } else if (gPressed) {
        e.preventDefault();
        const key = e.key.toLowerCase();
        if (key === 'o') router.push('/dashboard');
        if (key === 'r') router.push('/dashboard/repositories');
        if (key === 'v') router.push('/dashboard/reviews');
        if (key === 'a') router.push('/dashboard/analytics');
        gPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg bg-[#050505] border border-[var(--color-border)] rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[15px] font-bold text-[#e8e8e8]">Keyboard Shortcuts</h2>
              <button onClick={() => setIsOpen(false)} className="text-[#616161] hover:text-[#e8e8e8]">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-6">
              <ShortcutGroup title="Global" items={[
                { keys: ['?'], label: 'Show this help dialog' },
                { keys: ['Cmd', 'K'], label: 'Open command palette' },
                { keys: ['Cmd', 'B'], label: 'Toggle sidebar' },
                { keys: ['/'], label: 'Focus search' },
                { keys: ['N'], label: 'New review' },
              ]} />
              
              <ShortcutGroup title="Navigation (Go to...)" items={[
                { keys: ['G', 'O'], label: 'Overview' },
                { keys: ['G', 'R'], label: 'Repositories' },
                { keys: ['G', 'V'], label: 'Reviews' },
                { keys: ['G', 'A'], label: 'Analytics' },
              ]} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ShortcutGroup({ title, items }: { title: string, items: { keys: string[], label: string }[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-medium tracking-widest uppercase text-[#616161] mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center text-[13px]">
            <span className="text-[#898989]">{item.label}</span>
            <div className="flex gap-1.5">
              {item.keys.map((k, j) => (
                <kbd key={j} className="px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-white/5 text-[#e8e8e8] text-[10px] tabular-nums font-mono">
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('client/src/components/ui/ShortcutSheet.tsx', shortcuts);

// 3. Inject ShortcutSheet into layout
let layout = fs.readFileSync('client/src/app/layout.tsx', 'utf8');
if (!layout.includes('ShortcutSheet')) {
  layout = layout.replace("import { ToastContainer } from '@/components/ui/Toast';", "import { ToastContainer } from '@/components/ui/Toast';\nimport { ShortcutSheet } from '@/components/ui/ShortcutSheet';");
  layout = layout.replace("<ToastContainer />", "<ToastContainer />\n        <ShortcutSheet />");
  fs.writeFileSync('client/src/app/layout.tsx', layout);
}
