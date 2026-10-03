'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, GitBranch, FileCode, Activity, Shield } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  setOpen: (val: boolean) => void;
}

export function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  const rawOptions = [
    { id: 'new-review', label: 'New Review', icon: Plus, action: () => router.push('/dashboard/reviews/new') },
    { id: 'connect-repo', label: 'Connect Repository', icon: GitBranch, action: () => router.push('/dashboard/repositories') },
    { id: 'nav-overview', label: 'Go to Overview', icon: FileCode, action: () => router.push('/dashboard') },
    { id: 'nav-reviews', label: 'Go to Reviews', icon: FileCode, action: () => router.push('/dashboard/reviews') },
    { id: 'nav-analytics', label: 'Go to Analytics', icon: Activity, action: () => router.push('/dashboard/analytics') },
  ];

  if (user?.role === 'admin') {
    rawOptions.push({ id: 'nav-admin', label: 'Go to Admin Panel', icon: Shield, action: () => router.push('/dashboard/admin') });
  }

  const options = rawOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  // Keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    function handleNav(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, options.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (options[selectedIndex]) {
          options[selectedIndex].action();
          setOpen(false);
        }
      }
    }
    window.addEventListener('keydown', handleNav);
    return () => window.removeEventListener('keydown', handleNav);
  }, [open, options, selectedIndex, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl bg-[#0a0a0a] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden mx-4"
          >
            <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]">
              <Search size={16} className="text-[#616161] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search commands (e.g., 'New Review')..."
                className="w-full bg-transparent border-none outline-none px-3 text-[#e8e8e8] placeholder:text-[#616161] text-sm"
              />
              <div className="text-[10px] tracking-widest text-[#616161] px-2 py-0.5 border border-[var(--color-border)] rounded bg-white/5">ESC</div>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {options.length > 0 ? (
                options.map((option, idx) => (
                  <button
                    key={option.id}
                    onClick={() => { option.action(); setOpen(false); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
                      selectedIndex === idx ? "bg-white/10 text-[#e8e8e8]" : "text-[#898989] hover:text-[#e8e8e8]"
                    )}
                  >
                    <option.icon size={16} className={selectedIndex === idx ? "text-[#e8e8e8]" : "text-[#616161]"} />
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-[#616161]">
                  No results found for "{search}"
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
