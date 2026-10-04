const fs = require('fs');

const fonts = `
import { Outfit, Space_Grotesk, JetBrains_Mono } from 'next/font/google';

export const fontSans = Outfit({
  subsets: ['latin'],
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-sans',
});

export const fontDisplay = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600'],
  variable: '--font-mono',
});
`;
fs.writeFileSync('client/src/app/fonts.ts', fonts);

let layout = fs.readFileSync('client/src/app/layout.tsx', 'utf8');

if (!layout.includes('fontSans')) {
  layout = layout.replace(
    "import './globals.css';",
    "import './globals.css';\nimport { fontSans, fontDisplay, fontMono } from './fonts';"
  );
  
  // Remove the old google fonts link
  layout = layout.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossOrigin="anonymous" \/>\s*<link\s*href="https:\/\/fonts\.googleapis\.com\/css2\?family=[^"]+"\s*rel="stylesheet"\s*\/>/m, '');
  
  // Apply font variables to body
  layout = layout.replace(
    "<body className=\"bg-[#050505] text-[#e8e8e8] min-h-screen selection:bg-white/10 selection:text-white\">",
    "<body className={`bg-[#050505] text-[#e8e8e8] min-h-screen selection:bg-white/10 selection:text-white ${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} font-sans`}>"
  );
  
  fs.writeFileSync('client/src/app/layout.tsx', layout);
}

// Add loading.tsx per route segment. We already have Skeletons. 
// A loading.tsx in dashboard/ is enough for streaming the dashboard shell content.
const dashLoading = `
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="animate-in fade-in duration-300">
      <PageHeader title="Loading..." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[124px] rounded-2xl w-full" delay={0} />)}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-[68px] rounded-2xl w-full" delay={0} />)}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('client/src/app/dashboard/loading.tsx', dashLoading);
