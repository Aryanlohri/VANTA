const fs = require('fs');

// 1. Fix VantaMark export
let logo = fs.readFileSync('client/src/components/ui/VantaLogo.tsx', 'utf8');
if (logo.includes('function VantaMark')) {
  logo = logo.replace('function VantaMark', 'export function VantaMark');
  fs.writeFileSync('client/src/components/ui/VantaLogo.tsx', logo);
}

// 2. Fix dashboard page import
let dash = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');
dash = dash.replace("import { ShimmerText } from '@/components/ui/ShimmerText';\nimport { buildGreetingSummary, GreetingStats } from '@/lib/utils'; from '@/components/ui/ShimmerText';", "import { ShimmerText } from '@/components/ui/ShimmerText';\nimport { buildGreetingSummary, GreetingStats } from '@/lib/utils';");
fs.writeFileSync('client/src/app/dashboard/page.tsx', dash);
