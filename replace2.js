const fs = require('fs');

const content = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');

const replaced = content.replace(
  '{[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}',
  '{[1, 2, 3].map((i) => <div key={i} className="skeleton h-[68px] w-full rounded-2xl" />)}'
);

fs.writeFileSync('client/src/app/dashboard/page.tsx', replaced);
console.log("Done");
