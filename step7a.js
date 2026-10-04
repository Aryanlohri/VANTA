const fs = require('fs');

// 1. Polish globals.css
let css = fs.readFileSync('client/src/app/globals.css', 'utf8');

const printStyles = `
/* ============================================
   SELECTION & SCROLLBAR & CARET
   ============================================ */
::selection {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
* {
  caret-color: #b4b4b4;
}

/* Base focus outline for interactive elements */
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

/* ============================================
   PRINT STYLESHEET (PDF Export)
   ============================================ */
@media print {
  @page { margin: 1.5cm; size: A4 portrait; }
  
  body {
    background: white !important;
    color: black !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Hide navigation, sidebar, shell UI */
  aside, nav, .vanta-sidebar, .command-strip, .vanta-footer, button {
    display: none !important;
  }

  /* Invert main cards and text for print legibility */
  .glow-card, .metal-card, .border {
    background: transparent !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: none !important;
    color: black !important;
  }
  
  h1, h2, h3, h4, h5, h6, p, span, div {
    color: black !important;
    text-shadow: none !important;
  }

  /* Adjust rings and metrics for print */
  .score-ring-bg { stroke: #f3f4f6 !important; }
  .score-ring-fg { stroke: #000 !important; }

  /* Ensure page breaks make sense */
  .glow-card { page-break-inside: avoid; margin-bottom: 20px; }
  pre { page-break-inside: avoid; border: 1px solid #e5e7eb; background: #f9fafb !important; color: #111827 !important; }
}
`;

if (!css.includes('@media print')) {
  css = css + '\n' + printStyles;
  fs.writeFileSync('client/src/app/globals.css', css);
}

// 2. Add Export PDF and Copy Link buttons to Review Detail Page
let detail = fs.readFileSync('client/src/app/dashboard/reviews/[id]/page.tsx', 'utf8');

if (!detail.includes('window.print()')) {
  // Add Toast import
  if (!detail.includes('import { toast }')) {
    detail = detail.replace("import { useState", "import { toast } from '@/lib/toast';\nimport { useState");
  }
  
  // Add buttons to the PageHeader actions
  const exportBtns = `
      <div className="flex gap-2">
        <button 
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.notify("Link copied to clipboard", { label: "Dismiss", onClick: () => {} });
          }}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[#e8e8e8] border border-[var(--color-border)] rounded-md text-[13px] font-medium tracking-wide transition-colors print:hidden"
        >
          Copy Link
        </button>
        <button 
          onClick={() => window.print()}
          className="px-4 py-2 bg-[#e8e8e8] hover:bg-white text-black rounded-md text-[13px] font-medium tracking-wide transition-colors print:hidden"
        >
          Export PDF
        </button>
      </div>
  `;
  
  // Try to find the PageHeader and inject children. If not found, just inject before the title
  if (detail.includes('<PageHeader')) {
    detail = detail.replace(/<PageHeader[^>]*>/, (match) => {
      // If it's self closing, open it
      if (match.endsWith('/>')) {
        return match.slice(0, -2) + '>\n' + exportBtns + '\n</PageHeader>';
      }
      return match + '\n' + exportBtns;
    });
  } else {
    // manual fallback
    const target = '</h1>';
    detail = detail.replace(target, target + '\n' + exportBtns);
  }
  
  fs.writeFileSync('client/src/app/dashboard/reviews/[id]/page.tsx', detail);
}

// 3. Contrast pass notes:
// The user instructed: "any text dimmer than WCAG AA against its background (4.5:1 for body text) is brightened to the nearest passing token"
// The project uses #616161 against #0a0a0a/050505.
// #616161 against #0a0a0a has contrast ratio of ~3.6:1 (FAIL). 
// #898989 against #0a0a0a has contrast ratio of ~6.5:1 (PASS).
// We should replace #616161 with #898989 for body text.

const replaceContrast = (file) => {
  let c = fs.readFileSync(file, 'utf8');
  // We don't want to blindly replace all 616161 if it's used for disabled states or borders, 
  // but for text it should be bumped to #898989.
  c = c.replace(/text-\[\#616161\]/g, 'text-[#898989]');
  fs.writeFileSync(file, c);
};

const fgList = [
  'client/src/app/dashboard/page.tsx',
  'client/src/components/ui/FirstRunGuide.tsx',
  'client/src/app/not-found.tsx',
  'client/src/app/error.tsx',
  'client/src/app/login/page.tsx',
  'client/src/components/ui/ShortcutSheet.tsx',
  'client/src/components/ui/NotificationBell.tsx',
  'client/src/components/dashboard/ReviewRow.tsx'
];
fgList.forEach(f => {
  if (fs.existsSync(f)) replaceContrast(f);
});

