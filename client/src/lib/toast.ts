// Minimal pubsub for toasts
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
};