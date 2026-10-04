const fs = require('fs');
let dl = fs.readFileSync('client/src/app/dashboard/layout.tsx', 'utf8');
if (!dl.includes('PageTransition')) {
  dl = dl.replace("import { DashboardShell } from '@/components/dashboard/DashboardShell';", "import { DashboardShell } from '@/components/dashboard/DashboardShell';\nimport { PageTransition } from '@/components/ui/PageTransition';");
  dl = dl.replace(
    "{children}",
    "<PageTransition>{children}</PageTransition>"
  );
  fs.writeFileSync('client/src/app/dashboard/layout.tsx', dl);
}
