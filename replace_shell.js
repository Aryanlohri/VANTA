const fs = require('fs');

const path = 'client/src/components/dashboard/DashboardShell.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
content = content.replace("import { cn } from '@/lib/utils';", "import { cn } from '@/lib/utils';\nimport { PageTransition } from '@/components/ui/PageTransition';");

// Wrap children
const target = `<div className="max-w-6xl mx-auto px-6 py-8 md:px-8 relative z-10">\n            {children}\n          </div>`;
const replacement = `<div className="max-w-6xl mx-auto px-6 py-8 md:px-8 relative z-10">\n            <PageTransition>{children}</PageTransition>\n          </div>`;
content = content.replace(target, replacement);

fs.writeFileSync(path, content);
console.log("Done");
