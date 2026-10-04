const fs = require('fs');

// 1. Create client/src/lib/preloadEditor.ts
const preloadCode = `
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
`;
fs.writeFileSync('client/src/lib/preloadEditor.ts', preloadCode);

// 2. Call it in ReviewRow on mouse enter
let row = fs.readFileSync('client/src/components/dashboard/ReviewRow.tsx', 'utf8');
if (!row.includes('preloadEditor')) {
  row = row.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { preloadEditor } from '@/lib/preloadEditor';\nimport { queryClient } from '@/lib/queryClient';\nimport { reviewKeys, useReview } from '@/lib/queries/useReviews';");
  
  // Add onMouseEnter to the GlowCard/Link
  const targetTag = `<Link href={\`/dashboard/reviews/\${review.id}\`} className="block w-full">`;
  const newTag = `<Link 
      href={\`/dashboard/reviews/\${review.id}\`} 
      className="block w-full"
      onMouseEnter={() => {
        preloadEditor();
        queryClient.prefetchQuery({
          queryKey: reviewKeys.detail(review.id),
          queryFn: async () => {
            const { reviewApi } = await import('@/lib/api');
            const { data } = await reviewApi.getById(review.id);
            return data.data;
          },
          staleTime: 30000
        });
      }}
    >`;
  row = row.replace(targetTag, newTag);
  fs.writeFileSync('client/src/components/dashboard/ReviewRow.tsx', row);
}

// 3. Setup LazyMotion in Layout? Or DashboardShell?
// To keep Framer Motion bundle small, we need LazyMotion and domAnimation.
let layout = fs.readFileSync('client/src/app/layout.tsx', 'utf8');
if (!layout.includes('LazyMotion')) {
  layout = layout.replace("import QueryProvider from '@/lib/QueryProvider';", "import QueryProvider from '@/lib/QueryProvider';\nimport { LazyMotion, domAnimation } from 'framer-motion';");
  layout = layout.replace("<QueryProvider>", "<QueryProvider>\n          <LazyMotion features={domAnimation}>");
  layout = layout.replace("</QueryProvider>", "  </LazyMotion>\n        </QueryProvider>");
  fs.writeFileSync('client/src/app/layout.tsx', layout);
}
