const fs = require('fs');

let dash = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');

dash = dash.replace(
  "import { useState } from 'react';",
  "import { useState, useEffect } from 'react';"
);

// We want to replace the exact block
const oldBlock = `export default function DashboardPage() {
  const { user } = useAuthStore();
  const [repos, setRepos] = useState<any[]>([]);
  const [initialReviews, setInitialReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);

  const reviews = useLiveReviews(initialReviews);

  useEffect(() => {
    async function loadData() {
      try {
        const [repoRes, reviewRes] = await Promise.all([
          repoApi.listConnected().catch(() => ({ data: { data: [] } })),
          reviewApi.list().catch(() => ({ data: { data: [] } })),
        ]);
        setRepos(repoRes.data.data || []);
        setInitialReviews(reviewRes.data.data || []);
      } catch {
        // Services may not be running yet
      }
      setLoading(false);
    }
    loadData();
  }, []);`;

const newBlock = `export default function DashboardPage() {
  const { user } = useAuthStore();
  const [cmdOpen, setCmdOpen] = useState(false);

  const { data: initialReviews = [], isLoading: loadingReviews } = useReviews(1);
  const { data: repos = [], isLoading: loadingRepos } = useConnectedRepos();
  const loading = loadingReviews || loadingRepos;

  const reviews = useLiveReviews(initialReviews);`;

dash = dash.replace(oldBlock, newBlock);

fs.writeFileSync('client/src/app/dashboard/page.tsx', dash);
