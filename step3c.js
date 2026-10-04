const fs = require('fs');

let dash = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');

if (!dash.includes('FirstRunGuide')) {
  dash = dash.replace("import { GlowCard }", "import { FirstRunGuide } from '@/components/ui/FirstRunGuide';\nimport { GlowCard }");
  
  const target = '<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">';
  const replacement = '<FirstRunGuide reposCount={connected.length} reviewsCount={reviews.length} />\n          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">';
  
  dash = dash.replace(target, replacement);
  fs.writeFileSync('client/src/app/dashboard/page.tsx', dash);
}
