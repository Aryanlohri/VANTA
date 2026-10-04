const fs = require('fs');

const progressBar = `
'use client';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // In Next.js App Router, navigation is mostly instant and streamed.
    // If we wanted to accurately track the fetch we would bind to a custom router,
    // but a simple visual effect for route changes satisfies the requirement.
    setIsNavigating(true);
    const t1 = setTimeout(() => setIsNavigating(false), 300);
    return () => clearTimeout(t1);
  }, [pathname, searchParams]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[1px] z-[100] bg-transparent">
      <div className="h-full bg-[#e8e8e8] w-full origin-left animate-progress" />
      <style jsx>{\`
        @keyframes progress {
          0% { transform: scaleX(0); opacity: 1; }
          50% { transform: scaleX(0.7); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0; }
        }
        .animate-progress {
          animation: progress 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      \`}</style>
    </div>
  );
}
`;
fs.writeFileSync('client/src/components/ui/TopProgressBar.tsx', progressBar);

let layout = fs.readFileSync('client/src/app/layout.tsx', 'utf8');
if (!layout.includes('TopProgressBar')) {
  layout = layout.replace("import { DemoBanner } from '@/components/ui/DemoBanner';", "import { DemoBanner } from '@/components/ui/DemoBanner';\nimport { TopProgressBar } from '@/components/ui/TopProgressBar';");
  layout = layout.replace("<DemoBanner />", "<TopProgressBar />\n        <DemoBanner />");
  fs.writeFileSync('client/src/app/layout.tsx', layout);
}

// 2. Page enter transitions - only once per session
// We can wrap Dashboard views in a PageTransition component.
const transitionComp = `
'use client';
import { m } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function PageTransition({ children, className }: { children: React.ReactNode, className?: string }) {
  const pathname = usePathname();
  const [hasPlayed, setHasPlayed] = useState(true);

  useEffect(() => {
    const key = \`vanta_visited_\${pathname}\`;
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
`;
fs.writeFileSync('client/src/components/ui/PageTransition.tsx', transitionComp);
