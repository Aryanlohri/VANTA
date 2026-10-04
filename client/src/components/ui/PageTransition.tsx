
'use client';
import { m } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function PageTransition({ children, className }: { children: React.ReactNode, className?: string }) {
  const pathname = usePathname();
  const [hasPlayed, setHasPlayed] = useState(true);

  useEffect(() => {
    const key = `vanta_visited_${pathname}`;
    if (!sessionStorage.getItem(key)) {
      setHasPlayed(false);
      sessionStorage.setItem(key, 'true');
    } else {
      setHasPlayed(true);
    }
  }, [pathname]);

  if (hasPlayed) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </m.div>
  );
}
