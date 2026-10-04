const fs = require('fs');

let header = fs.readFileSync('client/src/components/ui/PageHeader.tsx', 'utf8');
header = header.replace(/delay=\{false\}/g, 'delay={0}');
fs.writeFileSync('client/src/components/ui/PageHeader.tsx', header);
