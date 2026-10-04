const fs = require('fs');
let header = fs.readFileSync('client/src/components/ui/PageHeader.tsx', 'utf8');
if (!header.includes('ShimmerText')) {
  header = header.replace("import { cn } from '@/lib/utils';", "import { cn } from '@/lib/utils';\nimport { ShimmerText } from './ShimmerText';");
  header = header.replace(
    '<h1 className="text-2xl font-bold tracking-tight text-[#e8e8e8]">{title}</h1>',
    '<h1 className="text-2xl font-bold tracking-tight text-[#e8e8e8]"><ShimmerText delay={0}>{title}</ShimmerText></h1>'
  );
  fs.writeFileSync('client/src/components/ui/PageHeader.tsx', header);
}
