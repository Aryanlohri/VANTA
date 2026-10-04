const fs = require('fs');

// 1. Restore Google Fonts in layout.tsx
let layout = fs.readFileSync('client/src/app/layout.tsx', 'utf8');

// Remove next/font imports
layout = layout.replace("import { fontSans, fontDisplay, fontMono } from './fonts';\n", "");

// Restore font links in the <head> section
const headStart = "<head>";
const fontLinks = `<head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />`;
layout = layout.replace(headStart, fontLinks);

// Restore the original body className
layout = layout.replace(
  /<body className=\{`bg-\[#050505\] text-\[#e8e8e8\] min-h-screen selection:bg-white\/10 selection:text-white \$\{fontSans\.variable\} \$\{fontDisplay\.variable\} \$\{fontMono\.variable\} font-sans`\}>/,
  '<body className="bg-[#050505] text-[#e8e8e8] min-h-screen selection:bg-white/10 selection:text-white">'
);

fs.writeFileSync('client/src/app/layout.tsx', layout);

// 2. Restore Brighter Shimmer in globals.css
let css = fs.readFileSync('client/src/app/globals.css', 'utf8');
css = css.replace('--shimmer-dark: #7d7d7d;', '--shimmer-dark: #616161;');
css = css.replace('--shimmer-peak: #e4e4e4;', '--shimmer-peak: #ffffff;');
fs.writeFileSync('client/src/app/globals.css', css);

// 3. Restore ShimmerText in PageHeader.tsx
let header = fs.readFileSync('client/src/components/ui/PageHeader.tsx', 'utf8');

// If we previously reverted it, we need to add the import back if it's missing (though it might still be there).
if (!header.includes("import { ShimmerText }")) {
  header = header.replace("import { cn } from '@/lib/utils';", "import { cn } from '@/lib/utils';\nimport { ShimmerText } from './ShimmerText';");
}

header = header.replace(
  '<h1 className="text-2xl font-bold tracking-tight text-[#e8e8e8]">{title}</h1>',
  '<h1 className="text-2xl font-bold tracking-tight text-[#e8e8e8]"><ShimmerText delay={false}>{title}</ShimmerText></h1>'
);

fs.writeFileSync('client/src/components/ui/PageHeader.tsx', header);
