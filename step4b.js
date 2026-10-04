const fs = require('fs');

let layout = fs.readFileSync('client/src/app/layout.tsx', 'utf8');

if (!layout.includes('DemoBanner')) {
  const demoBannerComp = `
'use client';
import { isDemoMode, disableDemoMode } from '@/lib/demoData';
import { useEffect, useState } from 'react';

export function DemoBanner() {
  const [demo, setDemo] = useState(false);
  useEffect(() => setDemo(isDemoMode()), []);
  if (!demo) return null;
  return (
    <div className="bg-[#0a0a0a] border-b border-[var(--color-border)] py-1.5 px-6 flex items-center justify-between">
      <span className="text-[12px] tracking-wide text-[#898989]">Demo workspace · sample data</span>
      <div className="flex gap-4">
        <button onClick={disableDemoMode} className="text-[11px] font-medium tracking-wide text-[#e8e8e8] uppercase hover:text-white">Exit demo</button>
      </div>
    </div>
  );
}
`;

  fs.writeFileSync('client/src/components/ui/DemoBanner.tsx', demoBannerComp);

  layout = layout.replace("import { ConnectivityBanner } from '@/components/ui/ConnectivityBanner';", "import { ConnectivityBanner } from '@/components/ui/ConnectivityBanner';\nimport { DemoBanner } from '@/components/ui/DemoBanner';");
  layout = layout.replace("<ConnectivityBanner />", "<DemoBanner />\n        <ConnectivityBanner />");
  fs.writeFileSync('client/src/app/layout.tsx', layout);
}
