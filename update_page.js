const fs = require('fs');
let content = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');

if (!content.includes('import { ShimmerText }')) {
  content = content.replace("import { GlowCard }", "import { ShimmerText } from '@/components/ui/ShimmerText';\nimport { GlowCard }");
}

content = content.replace(
  '<span className="gradient-text">{displayName}</span>',
  '<ShimmerText delay={600}>{displayName}</ShimmerText>'
);

fs.writeFileSync('client/src/app/dashboard/page.tsx', content);
