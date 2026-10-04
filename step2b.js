const fs = require('fs');

// 1. Update layout.tsx with ConnectivityBanner
let layout = fs.readFileSync('client/src/app/layout.tsx', 'utf8');
if (!layout.includes('ConnectivityBanner')) {
  layout = layout.replace("import { ToastContainer } from '@/components/ui/Toast';", "import { ToastContainer } from '@/components/ui/Toast';\nimport { ConnectivityBanner } from '@/components/ui/ConnectivityBanner';");
  layout = layout.replace('{children}', '<ConnectivityBanner />\n        {children}');
  fs.writeFileSync('client/src/app/layout.tsx', layout);
}

// 2. Update dashboard/page.tsx with buildGreetingSummary
let dash = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');
if (!dash.includes('buildGreetingSummary')) {
  dash = dash.replace("import { ShimmerText }", "import { ShimmerText } from '@/components/ui/ShimmerText';\nimport { buildGreetingSummary, GreetingStats } from '@/lib/utils';");
  dash = dash.replace("import { ShimmerText } from '@/components/ui/ShimmerText';\nimport { ShimmerText }", "import { ShimmerText }");
  
  // Need to calculate stats for the greeting
  const newLoad = `const [greetingMsg, setGreetingMsg] = useState('...');
  
  async function load() {
    try {
      const [revs, repos] = await Promise.all([
        reviewApi.list(),
        repoApi.listConnected()
      ]);
      const loadedRevs = revs.data.data || [];
      const loadedRepos = repos.data.data || [];
      setReviews(loadedRevs);
      
      const failed = loadedRevs.filter((r: any) => r.status === 'failed').length;
      const prog = loadedRevs.filter((r: any) => r.status === 'processing' || r.status === 'queued').length;
      
      setGreetingMsg(buildGreetingSummary({
        failedThisWeek: failed,
        inProgress: prog,
        scoreTrend: loadedRepos.length > 0 ? 1.2 : 0, // Mock trend for now
        totalThisMonth: loadedRevs.length,
        isFirstRun: loadedRepos.length === 0 && loadedRevs.length === 0
      }));
    } catch { /* ignore */ }
    setLoading(false);
  }`;
  
  dash = dash.replace(/async function load\(\) \{[\s\S]*?setLoading\(false\);\n  \}/, newLoad);
  
  // Replace the subtitle
  dash = dash.replace(
    "<p className=\"text-sm\" style={{ color: 'var(--color-text-secondary)' }}>\n              Here&apos;s an overview of your code review activity.\n            </p>",
    `<p className="text-[13px] text-[#898989] h-[20px] transition-opacity duration-200">
              {loading ? '...' : greetingMsg.split(/(\\d+(?:\\.\\d+)?)/).map((part, i) => 
                /^\\d+(?:\\.\\d+)?$/.test(part) ? <span key={i} className="text-[#b4b4b4] tabular-nums font-medium">{part}</span> : part
              )}
            </p>`
  );
  
  fs.writeFileSync('client/src/app/dashboard/page.tsx', dash);
}
