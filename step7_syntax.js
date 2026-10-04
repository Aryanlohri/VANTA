const fs = require('fs');

let rev = fs.readFileSync('client/src/app/dashboard/reviews/page.tsx', 'utf8');

rev = rev.replace(
  'return matchesStatus && matchesSearch;\n  });',
  'return matchesStatus && matchesSearch;\n  }), [reviews, filter, search]);'
);

fs.writeFileSync('client/src/app/dashboard/reviews/page.tsx', rev);
