const fs = require('fs');

// Fix TopProgressBar in layout.tsx
let layout = fs.readFileSync('client/src/app/layout.tsx', 'utf8');
layout = layout.replace(
  "import { TopProgressBar } from '@/components/ui/TopProgressBar';",
  "import { TopProgressBar } from '@/components/ui/TopProgressBar';\nimport { Suspense } from 'react';"
);
layout = layout.replace(
  "<TopProgressBar />",
  "<Suspense fallback={null}><TopProgressBar /></Suspense>"
);
fs.writeFileSync('client/src/app/layout.tsx', layout);

// Fix auth/callback
let cb = fs.readFileSync('client/src/app/auth/callback/page.tsx', 'utf8');
if (!cb.includes('Suspense')) {
  cb = cb.replace("import { useEffect } from 'react';", "import { useEffect, Suspense } from 'react';");
  
  // Wrap the entire AuthCallback component in Suspense
  // It's probably easier to rename the component and wrap it
  cb = cb.replace("export default function AuthCallback() {", "function AuthCallbackContent() {");
  cb += "\n\nexport default function AuthCallback() { return <Suspense fallback={null}><AuthCallbackContent /></Suspense>; }\n";
  fs.writeFileSync('client/src/app/auth/callback/page.tsx', cb);
}
