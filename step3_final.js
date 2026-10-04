const fs = require('fs');

let dash = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');

dash = dash.replace(
  "import { useEffect, useState } from 'react';",
  "import { useState } from 'react';\nimport { useReviews } from '@/lib/queries/useReviews';\nimport { useConnectedRepos } from '@/lib/queries/useRepos';"
);

// We want to replace the state hooks and useEffect logic.
const hookStartRegex = /export default function DashboardPage\(\) \{[\s\S]*?setLoading\(false\);\n    \}\n    loadData\(\);\n  \}, \[\]\);/;

const newHookStart = `export default function DashboardPage() {
  const { user } = useAuthStore();
  const [cmdOpen, setCmdOpen] = useState(false);

  const { data: initialReviews = [], isLoading: loadingReviews } = useReviews(1);
  const { data: repos = [], isLoading: loadingRepos } = useConnectedRepos();
  const loading = loadingReviews || loadingRepos;

  const reviews = useLiveReviews(initialReviews);`;

dash = dash.replace(hookStartRegex, newHookStart);
fs.writeFileSync('client/src/app/dashboard/page.tsx', dash);
