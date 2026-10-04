const fs = require('fs');

const demoData = `// TODO: Move demo mode to a dedicated backend workspace. This is a client-side interceptor for now.
export const isDemoMode = () => typeof window !== 'undefined' && localStorage.getItem('vanta_demo_mode') === 'true';

export const enableDemoMode = () => {
  localStorage.setItem('vanta_demo_mode', 'true');
  window.location.href = '/dashboard';
};

export const disableDemoMode = () => {
  localStorage.removeItem('vanta_demo_mode');
  window.location.href = '/login';
};

export const demoMockData = {
  repos: [
    { id: 'd1', name: 'vanta-core', full_name: 'acme/vanta-core', language: 'TypeScript', default_branch: 'main', private: true, is_connected: true },
    { id: 'd2', name: 'payment-gateway', full_name: 'acme/payment-gateway', language: 'Go', default_branch: 'main', private: true, is_connected: true },
    { id: 'd3', name: 'marketing-site', full_name: 'acme/marketing-site', language: 'JavaScript', default_branch: 'main', private: false, is_connected: true },
  ],
  reviews: [
    { id: 'r1', repo_id: 'd1', branch: 'feature/auth', commit_sha: 'abc1234', status: 'completed', score: 92, total_issues: 2, created_at: new Date().toISOString() },
    { id: 'r2', repo_id: 'd2', branch: 'fix/billing', commit_sha: 'def5678', status: 'processing', score: null, total_issues: 0, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'r3', repo_id: 'd3', branch: 'update-copy', commit_sha: 'ghi9012', status: 'failed', score: null, total_issues: 0, error: 'NO_CODE_CHANGED', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'r4', repo_id: 'd1', branch: 'refactor/db', commit_sha: 'jkl3456', status: 'completed', score: 65, total_issues: 12, created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 'r5', repo_id: 'd2', branch: 'feat/webhooks', commit_sha: 'mno7890', status: 'completed', score: 45, total_issues: 28, created_at: new Date(Date.now() - 86400000 * 10).toISOString() },
  ],
  stats: {
    d1: { avgScore: 78, lastReviewDate: new Date().toISOString(), openIssues: 14 },
    d2: { avgScore: 45, lastReviewDate: new Date(Date.now() - 86400000 * 10).toISOString(), openIssues: 28 },
    d3: { avgScore: 0, lastReviewDate: new Date(Date.now() - 86400000).toISOString(), openIssues: 0 },
  }
};
`;
fs.writeFileSync('client/src/lib/demoData.ts', demoData);

let apiContent = fs.readFileSync('client/src/lib/api.ts', 'utf8');

const interceptorInjection = `// Response interceptor - handle auth errors and DEMO mode`;
const interceptorCode = `
import { isDemoMode, demoMockData } from './demoData';
import { toast } from './toast';

api.interceptors.request.use(async (config) => {
  if (isDemoMode()) {
    // Intercept GET requests
    if (config.method?.toLowerCase() === 'get') {
      const url = config.url || '';
      if (url.includes('/repos/github')) return { ...config, adapter: async () => ({ data: { data: [] }, status: 200, statusText: 'OK', headers: {}, config: config as any }) } as any;
      if (url.includes('/repos')) return { ...config, adapter: async () => ({ data: { data: demoMockData.repos }, status: 200, statusText: 'OK', headers: {}, config: config as any }) } as any;
      if (url.includes('/reviews/analytics/repos')) return { ...config, adapter: async () => ({ data: { data: demoMockData.stats }, status: 200, statusText: 'OK', headers: {}, config: config as any }) } as any;
      if (url.includes('/reviews')) return { ...config, adapter: async () => ({ data: { data: demoMockData.reviews }, status: 200, statusText: 'OK', headers: {}, config: config as any }) } as any;
      if (url.includes('/auth/me')) return { ...config, adapter: async () => ({ data: { data: { id: 'demo-user', username: 'demo', display_name: 'Demo User' } }, status: 200, statusText: 'OK', headers: {}, config: config as any }) } as any;
    }
    // Block write requests
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      toast.notify("Demo mode: write actions are disabled.", { label: "Dismiss", onClick: () => {} });
      return { ...config, adapter: async () => ({ data: { data: {} }, status: 200, statusText: 'OK', headers: {}, config: config as any }) } as any;
    }
  }
`;

apiContent = apiContent.replace("api.interceptors.request.use((config) => {", interceptorCode);

fs.writeFileSync('client/src/lib/api.ts', apiContent);
