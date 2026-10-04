const fs = require('fs');

let dash = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');

dash = dash.replace(
  "import { useEffect, useState } from 'react';",
  "import { useState } from 'react';\nimport { useReviews } from '@/lib/queries/useReviews';\nimport { useConnectedRepos, useRepoStats } from '@/lib/queries/useRepos';"
);

// We want to replace the `load` logic with `useQuery`.
const targetHookStart = `export default function DashboardPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greetingMsg, setGreetingMsg] = useState('...');
  
  async function load() {
    try {
      const [revs, connected] = await Promise.all([
        reviewApi.list(),
        repoApi.listConnected()
      ]);
      const loadedRevs = revs.data.data || [];
      const loadedRepos = connected.data.data || [];
      setReviews(loadedRevs);
      setRepos(loadedRepos);
      
      const failed = loadedRevs.filter((r: any) => r.status === 'failed').length;
      const prog = loadedRevs.filter((r: any) => r.status === 'processing' || r.status === 'queued').length;
      
      setGreetingMsg(buildGreetingSummary({
        failedThisWeek: failed,
        inProgress: prog,
        scoreTrend: loadedRepos.length > 0 ? 1.2 : 0,
        totalThisMonth: loadedRevs.length,
        isFirstRun: loadedRepos.length === 0 && loadedRevs.length === 0
      }));
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);`;

const newHookStart = `export default function DashboardPage() {
  const { data: reviews = [], isLoading: loadingReviews } = useReviews(1);
  const { data: repos = [], isLoading: loadingRepos } = useConnectedRepos();
  const loading = loadingReviews || loadingRepos;
  
  const failed = reviews.filter((r: any) => r.status === 'failed').length;
  const prog = reviews.filter((r: any) => r.status === 'processing' || r.status === 'queued').length;
  const greetingMsg = buildGreetingSummary({
    failedThisWeek: failed,
    inProgress: prog,
    scoreTrend: repos.length > 0 ? 1.2 : 0,
    totalThisMonth: reviews.length,
    isFirstRun: repos.length === 0 && reviews.length === 0
  });`;

dash = dash.replace(targetHookStart, newHookStart);
fs.writeFileSync('client/src/app/dashboard/page.tsx', dash);
