// TODO: Move demo mode to a dedicated backend workspace. This is a client-side interceptor for now.
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
