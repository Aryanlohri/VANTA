const fs = require('fs');
let rev = fs.readFileSync('client/src/app/dashboard/reviews/page.tsx', 'utf8');
if (!rev.includes('import { Skeleton }')) {
  rev = rev.replace("import { ReviewRow }", "import { Skeleton } from '@/components/ui/Skeleton';\nimport { ReviewRow }");
  fs.writeFileSync('client/src/app/dashboard/reviews/page.tsx', rev);
}
