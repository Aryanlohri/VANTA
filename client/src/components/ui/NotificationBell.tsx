'use client';
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
                <div className="px-4 py-8 text-center text-[#898989] text-[12px]">No notifications yet.</div>
              ) : (
                events.slice(0, 10).map((event) => (
                  <div key={event.id} className="px-4 py-3 border-b border-[var(--color-border)]/50 last:border-0 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[13px] font-medium ${event.read ? 'text-[#898989]' : 'text-[#e8e8e8]'}`}>
                        {event.title}
                      </span>
                      <span className="text-[10px] text-[#898989] tabular-nums shrink-0 ml-2">
                        {formatRelativeTime(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#898989] line-clamp-2">{event.message}</p>
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
