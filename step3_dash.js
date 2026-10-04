const fs = require('fs');
let dash = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');

// Dashboard page uses `reviews` and `repos` state, and `loading` state.
const imports = `import { useReviews } from '@/lib/queries/useReviews';
import { useConnectedRepos, useRepoStats } from '@/lib/queries/useRepos';`;

if (!dash.includes('useReviews')) {
  dash = dash.replace("import { useEffect, useState } from 'react';", "import { useEffect, useState } from 'react';\n" + imports);
  
  // Replace the load() mechanism
  const hookStart = "export default function DashboardPage() {";
  const newHookStart = `export default function DashboardPage() {
  const { data: reviews = [], isLoading: loadingReviews } = useReviews(1);
  const { data: repos = [], isLoading: loadingRepos } = useConnectedRepos();
  const loading = loadingReviews || loadingRepos;
  
  // The rest of the state we don't need to manually fetch anymore
`;
  
  // Remove the old load() and useEffect
  dash = dash.replace(/const \[loading, setLoading\] = useState\(true\);[\s\S]*?setLoading\(false\);\n  \}/, '');
  dash = dash.replace(/useEffect\(\(\) => \{\n    load\(\);\n  \}, \[\]\);/, '');
  dash = dash.replace(/const \[reviews, setReviews\] = useState<any\[\]>\(\[\]\);/, '');
  dash = dash.replace(/const \[repos, setRepos\] = useState<any\[\]>\(\[\]\);/, '');
  dash = dash.replace("export default function DashboardPage() {", newHookStart);
  
  fs.writeFileSync('client/src/app/dashboard/page.tsx', dash);
}

// Update ReviewRow to use Optimistic Delete/Retry
let row = fs.readFileSync('client/src/components/dashboard/ReviewRow.tsx', 'utf8');
if (!row.includes('useDeleteReview')) {
  row = row.replace("import { useState } from 'react';", "import { useState } from 'react';\nimport { useDeleteReview, useRetryReview } from '@/lib/queries/useReviews';");
  
  // Add hooks inside ReviewRow
  row = row.replace("export function ReviewRow({ review, allReviews }: { review: any; allReviews?: any[] }) {", `export function ReviewRow({ review, allReviews }: { review: any; allReviews?: any[] }) {
  const { mutate: deleteReview } = useDeleteReview();
  const { mutate: retryReview } = useRetryReview();
  const handleDelete = () => deleteReview(review.id);
  const handleRetry = () => retryReview(review.id);
`);
  // And pass handleRetry / handleDelete to the UI if not already passed, wait, the props might already receive them? 
  // Wait, ReviewRow might receive onRetry and onDelete from props, I should just map them if they are undefined.
  row = row.replace(/onDelete\?: \(id: string\) => void;/, 'onDelete?: (id: string) => void;');
}
