const fs = require('fs');
let detail = fs.readFileSync('client/src/app/dashboard/reviews/[id]/page.tsx', 'utf8');
if (!detail.includes('import { toast }')) {
  detail = detail.replace("import { useState", "import { toast } from '@/lib/toast';\nimport { useState");
  fs.writeFileSync('client/src/app/dashboard/reviews/[id]/page.tsx', detail);
}
