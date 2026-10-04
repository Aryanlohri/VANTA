
'use client';

let preloaded = false;

export function preloadEditor() {
  if (preloaded || typeof window === 'undefined') return;
  preloaded = true;
  
  const load = () => {
    import('@monaco-editor/react').catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(load);
  } else {
    setTimeout(load, 2000);
  }
}
