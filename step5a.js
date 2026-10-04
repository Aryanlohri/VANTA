const fs = require('fs');

// 1. Event Store
const eventsData = `// TODO: Replace with real backend event endpoint
export interface AppEvent {
  id: string;
  type: 'review_completed' | 'review_failed' | 'repo_connected' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

let events: AppEvent[] = [];
let listeners: ((events: AppEvent[]) => void)[] = [];

// Load from local storage for persistence across reloads
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('vanta_events');
    if (saved) events = JSON.parse(saved);
  } catch {}
}

const save = () => {
  if (typeof window !== 'undefined') localStorage.setItem('vanta_events', JSON.stringify(events));
  listeners.forEach(l => l([...events]));
};

export const eventStore = {
  add: (event: Omit<AppEvent, 'id' | 'timestamp' | 'read'>) => {
    const newEvent: AppEvent = {
      ...event,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      read: false
    };
    events = [newEvent, ...events].slice(0, 50); // Keep last 50
    save();
  },
  markAllRead: () => {
    events = events.map(e => ({ ...e, read: true }));
    save();
  },
  get: () => [...events],
  subscribe: (listener: (events: AppEvent[]) => void) => {
    listeners.push(listener);
    listener([...events]);
    return () => { listeners = listeners.filter(l => l !== listener); };
  }
};
`;
fs.writeFileSync('client/src/lib/events.ts', eventsData);

// 2. NotificationBell Component
const bellComp = `'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { AppEvent, eventStore } from '@/lib/events';
import { formatRelativeTime } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

export function NotificationBell() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => eventStore.subscribe(setEvents), []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = events.filter(e => !e.read).length;

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      eventStore.markAllRead();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={handleOpen}
        className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-[var(--color-border)] flex items-center justify-center text-[#898989] hover:text-[#e8e8e8] transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={14} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#f87171] rounded-full" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 bg-[#050505] border border-[var(--color-border)] rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-[var(--color-border)] flex justify-between items-center bg-[#0a0a0a]">
              <h3 className="text-[12px] font-medium tracking-wide uppercase text-[#e8e8e8]">Notifications</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {events.length === 0 ? (
                <div className="px-4 py-8 text-center text-[#616161] text-[12px]">No notifications yet.</div>
              ) : (
                events.slice(0, 10).map((event) => (
                  <div key={event.id} className="px-4 py-3 border-b border-[var(--color-border)]/50 last:border-0 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className={\`text-[13px] font-medium \${event.read ? 'text-[#898989]' : 'text-[#e8e8e8]'}\`}>
                        {event.title}
                      </span>
                      <span className="text-[10px] text-[#616161] tabular-nums shrink-0 ml-2">
                        {formatRelativeTime(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#616161] line-clamp-2">{event.message}</p>
                    {event.link && (
                      <Link href={event.link} className="text-[11px] text-[#898989] hover:text-[#e8e8e8] mt-2 inline-block transition-colors" onClick={() => setIsOpen(false)}>
                        View details &rarr;
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`;
fs.writeFileSync('client/src/components/ui/NotificationBell.tsx', bellComp);

// 3. Inject NotificationBell into DashboardShell
let shell = fs.readFileSync('client/src/components/dashboard/DashboardShell.tsx', 'utf8');
if (!shell.includes('NotificationBell')) {
  shell = shell.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { NotificationBell } from '@/components/ui/NotificationBell';");
  
  // Inject right before the user avatar
  shell = shell.replace(
    `<div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">`,
    `<NotificationBell />\n            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">`
  );
  fs.writeFileSync('client/src/components/dashboard/DashboardShell.tsx', shell);
}
