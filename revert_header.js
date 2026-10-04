const fs = require('fs');

let header = fs.readFileSync('client/src/components/ui/PageHeader.tsx', 'utf8');

// Revert the Shimmer injection
header = header.replace(
  '<h1 className="text-2xl font-bold tracking-tight text-[#e8e8e8]"><ShimmerText delay={false}>{title}</ShimmerText></h1>',
  '<h1 className="text-2xl font-bold tracking-tight text-[#e8e8e8]">{title}</h1>'
);
// Catch any other variations
header = header.replace(/<ShimmerText[^>]*>\{title\}<\/ShimmerText>/g, '{title}');

fs.writeFileSync('client/src/components/ui/PageHeader.tsx', header);
