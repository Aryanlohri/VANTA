const fs = require('fs');

const pages = [
  'client/src/app/dashboard/page.tsx',
  'client/src/app/dashboard/repositories/page.tsx',
  'client/src/app/dashboard/reviews/page.tsx',
  'client/src/app/dashboard/analytics/page.tsx'
];

pages.forEach(p => {
  let content = fs.readFileSync(p, 'utf8');
  
  if (content.includes('className="skeleton')) {
    if (!content.includes('import { Skeleton }')) {
      content = content.replace("import { GlowCard }", "import { Skeleton } from '@/components/ui/Skeleton';\nimport { GlowCard }");
    }
    
    // Replace <div className="skeleton ..."> with <Skeleton className="..." />
    // Also works for span
    content = content.replace(/<(div|span) [^>]*className="skeleton ([^"]+)"[^>]*\/>/g, '<Skeleton className="$2" />');
    
    fs.writeFileSync(p, content);
  }
});
