const fs = require('fs');

let utils = fs.readFileSync('client/src/lib/utils.ts', 'utf8');
const helpers = `
// --- Date & Number Helpers ---
export function formatRelativeTime(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return \`\${Math.floor(diffInSeconds / 60)}m ago\`;
  if (diffInSeconds < 86400) return \`\${Math.floor(diffInSeconds / 3600)}h ago\`;
  if (diffInSeconds < 2592000) return \`\${Math.floor(diffInSeconds / 86400)}d ago\`;
  if (diffInSeconds < 31536000) return \`\${Math.floor(diffInSeconds / 2592000)}mo ago\`;
  return \`\${Math.floor(diffInSeconds / 31536000)}y ago\`;
}

export function formatAbsoluteTime(dateString: string | Date): string {
  return new Date(dateString).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// --- Greeting Summary ---
export interface GreetingStats {
  failedThisWeek: number;
  inProgress: number;
  scoreTrend: number;
  totalThisMonth: number;
  isFirstRun: boolean;
}

export function buildGreetingSummary(stats: GreetingStats): string {
  if (stats.isFirstRun) return 'Welcome to VANTA. Connect a repository to start your first review.';
  
  const facts: string[] = [];
  
  if (stats.failedThisWeek > 0) facts.push(\`\${stats.failedThisWeek} review\${stats.failedThisWeek > 1 ? 's' : ''} failed this week\`);
  else if (stats.inProgress > 0) facts.push(\`\${stats.inProgress} review\${stats.inProgress > 1 ? 's' : ''} in progress\`);
  
  if (stats.scoreTrend !== 0) {
    const dir = stats.scoreTrend > 0 ? 'up' : 'down';
    facts.push(\`average score \${dir} \${Math.abs(stats.scoreTrend).toFixed(1)} this month\`);
  }
  
  if (facts.length < 2 && stats.totalThisMonth > 0) {
    facts.push(\`\${formatCompactNumber(stats.totalThisMonth)} reviews this month\`);
  }
  
  if (facts.length === 0) return 'All systems normal · ready for review.';
  
  return facts.slice(0, 2).join(' · ');
}
`;

utils = utils + '\n\n' + helpers;
fs.writeFileSync('client/src/lib/utils.ts', utils);

const tests = `import { buildGreetingSummary } from './utils';

describe('buildGreetingSummary', () => {
  it('returns first run message', () => {
    expect(buildGreetingSummary({ isFirstRun: true, failedThisWeek: 0, inProgress: 0, scoreTrend: 0, totalThisMonth: 0 }))
      .toBe('Welcome to VANTA. Connect a repository to start your first review.');
  });
  
  it('prioritizes failed reviews and score trend', () => {
    expect(buildGreetingSummary({ isFirstRun: false, failedThisWeek: 2, inProgress: 1, scoreTrend: 2.4, totalThisMonth: 40 }))
      .toBe('2 reviews failed this week · average score up 2.4 this month');
  });
  
  it('shows in progress if no failures', () => {
    expect(buildGreetingSummary({ isFirstRun: false, failedThisWeek: 0, inProgress: 1, scoreTrend: -1.2, totalThisMonth: 40 }))
      .toBe('1 review in progress · average score down 1.2 this month');
  });
  
  it('falls back to volume if only one primary fact', () => {
    expect(buildGreetingSummary({ isFirstRun: false, failedThisWeek: 0, inProgress: 0, scoreTrend: 2.0, totalThisMonth: 40 }))
      .toBe('average score up 2.0 this month · 40 reviews this month');
  });
  
  it('shows neutral state when no facts', () => {
    expect(buildGreetingSummary({ isFirstRun: false, failedThisWeek: 0, inProgress: 0, scoreTrend: 0, totalThisMonth: 0 }))
      .toBe('All systems normal · ready for review.');
  });
});
`;
fs.writeFileSync('client/src/lib/utils.test.ts', tests);

const skeleton = `'use client';
import { cn } from '@/lib/utils';
export function Skeleton({ className, delay = true }: { className?: string; delay?: boolean }) {
  return (
    <div 
      className={cn("bg-white/5 rounded-xl animate-pulse", className)} 
      style={{ animationDelay: delay ? '150ms' : '0ms' }}
    />
  );
}`;
fs.writeFileSync('client/src/components/ui/Skeleton.tsx', skeleton);

const toastStore = `// Minimal pubsub for toasts
export interface Toast {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

let toasts: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

export const toast = {
  notify: (message: string, action?: { label: string; onClick: () => void }) => {
    const id = Math.random().toString(36).slice(2, 9);
    toasts = [...toasts, { id, message, action }].slice(-3); // Stack max 3
    listeners.forEach(l => l(toasts));
    setTimeout(() => toast.dismiss(id), 5000); // 5s auto-dismiss
  },
  dismiss: (id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(l => l(toasts));
  },
  subscribe: (listener: (toasts: Toast[]) => void) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  }
};`;
fs.writeFileSync('client/src/lib/toast.ts', toastStore);

const toastComponent = `'use client';
import { useEffect, useState } from 'react';
import { Toast, toast as toastStore } from '@/lib/toast';
import { AnimatePresence, motion } from 'framer-motion';

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
          <motion.div
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
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}`;
fs.writeFileSync('client/src/components/ui/Toast.tsx', toastComponent);
