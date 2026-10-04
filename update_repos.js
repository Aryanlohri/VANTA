const fs = require('fs');
let content = fs.readFileSync('client/src/app/dashboard/repositories/page.tsx', 'utf8');

content = content.replace("import { repoApi } from '@/lib/api';", "import { repoApi, reviewApi } from '@/lib/api';");
content = content.replace("const [connecting, setConnecting] = useState<string | null>(null);", "const [connecting, setConnecting] = useState<string | null>(null);\n  const [repoStats, setRepoStats] = useState<Record<string, any>>({});");

const targetLoad = `    async function load() {
      try {
        const res = await repoApi.list();
        setConnected(res.data.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    }`;

const newLoad = `    async function load() {
      try {
        const [reposRes, statsRes] = await Promise.all([
          repoApi.list(),
          reviewApi.getRepoStats().catch(() => ({ data: { data: {} } }))
        ]);
        setConnected(reposRes.data.data || []);
        setRepoStats(statsRes.data?.data || {});
      } catch { /* ignore */ }
      setLoading(false);
    }`;

content = content.replace(targetLoad, newLoad);

content = content.replace("const lastReviewDate = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); // TODO: replace with real backend data", "const stats = repoStats[repo.id] || {};\n            const lastReviewDate = stats.lastReviewDate ? new Date(stats.lastReviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never';");
content = content.replace("const avgScore = repo.id.length > 5 ? 85 : 62; // TODO: replace with real backend data", "const avgScore = stats.avgScore || null;");
content = content.replace("const openIssues = repo.id.length % 5; // TODO: replace with real backend data", "const openIssues = stats.openIssues || 0;");

fs.writeFileSync('client/src/app/dashboard/repositories/page.tsx', content);
