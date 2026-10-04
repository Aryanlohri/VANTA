const fs = require('fs');

let dash = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');

dash = dash.replace(
  "Here&apos;s an overview of your code review activity.",
  "{greetingMsg}"
);

if (!dash.includes('buildGreetingSummary')) {
  dash = dash.replace(
    "import { useConnectedRepos } from '@/lib/queries/useRepos';",
    "import { useConnectedRepos } from '@/lib/queries/useRepos';\nimport { buildGreetingSummary } from '@/lib/utils';"
  );
}

fs.writeFileSync('client/src/app/dashboard/page.tsx', dash);
