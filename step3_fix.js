const fs = require('fs');

// 1. Fix missing Skeleton import in reviews/page.tsx
let rev = fs.readFileSync('client/src/app/dashboard/reviews/page.tsx', 'utf8');
if (!rev.includes('import { Skeleton }')) {
  rev = rev.replace("import { GlowCard }", "import { Skeleton } from '@/components/ui/Skeleton';\nimport { GlowCard }");
  fs.writeFileSync('client/src/app/dashboard/reviews/page.tsx', rev);
}

// 2. Fix VantaMark export
let logo = fs.readFileSync('client/src/components/ui/VantaLogo.tsx', 'utf8');
logo = logo.replace('const VantaMark =', 'export const VantaMark =');
logo = logo.replace('function VantaMark', 'export function VantaMark');
fs.writeFileSync('client/src/components/ui/VantaLogo.tsx', logo);

// 3. Fix GlowCard import path in FirstRunGuide.tsx
let guide = fs.readFileSync('client/src/components/ui/FirstRunGuide.tsx', 'utf8');
guide = guide.replace("import { GlowCard } from './dashboard/GlowCard';", "import { GlowCard } from '../dashboard/GlowCard';");
fs.writeFileSync('client/src/components/ui/FirstRunGuide.tsx', guide);

// 4. Fix test file to use node's assert instead of jest
const newTest = `const assert = require('assert');
import { buildGreetingSummary } from './utils';

// Run tests immediately when this file is executed or imported in test environment
function runTests() {
  assert.strictEqual(
    buildGreetingSummary({ isFirstRun: true, failedThisWeek: 0, inProgress: 0, scoreTrend: 0, totalThisMonth: 0 }),
    'Welcome to VANTA. Connect a repository to start your first review.'
  );
  
  assert.strictEqual(
    buildGreetingSummary({ isFirstRun: false, failedThisWeek: 2, inProgress: 1, scoreTrend: 2.4, totalThisMonth: 40 }),
    '2 reviews failed this week · average score up 2.4 this month'
  );
  
  assert.strictEqual(
    buildGreetingSummary({ isFirstRun: false, failedThisWeek: 0, inProgress: 1, scoreTrend: -1.2, totalThisMonth: 40 }),
    '1 review in progress · average score down 1.2 this month'
  );
  
  assert.strictEqual(
    buildGreetingSummary({ isFirstRun: false, failedThisWeek: 0, inProgress: 0, scoreTrend: 2.0, totalThisMonth: 40 }),
    'average score up 2.0 this month · 40 reviews this month'
  );
  
  assert.strictEqual(
    buildGreetingSummary({ isFirstRun: false, failedThisWeek: 0, inProgress: 0, scoreTrend: 0, totalThisMonth: 0 }),
    'All systems normal · ready for review.'
  );
  console.log("Greeting tests passed");
}
runTests();
`;
fs.writeFileSync('client/src/lib/utils.test.ts', newTest);
