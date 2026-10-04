// TODO: Replace with real backend event endpoint
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
