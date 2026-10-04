const fs = require('fs');
const path = 'client/src/app/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const displayTitle[\s\S]*?<\/GlowCard>\s*\);\s*}\)/;
if (regex.test(content)) {
  content = content.replace(regex, `return <ReviewRow key={review.id} review={review} allReviews={reviews} />;\n              })`);
  
  if (!content.includes('import { ReviewRow }')) {
    content = content.replace("import { GlowCard } from '@/components/dashboard/GlowCard';", "import { GlowCard } from '@/components/dashboard/GlowCard';\nimport { ReviewRow } from '@/components/dashboard/ReviewRow';");
  }
  
  fs.writeFileSync(path, content);
  console.log("Done");
} else {
  console.log("Not found");
}
