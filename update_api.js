const fs = require('fs');

let api = fs.readFileSync('client/src/lib/api.ts', 'utf8');

if (!api.includes('updateSettings')) {
  // Add it to authApi
  const target = `getProfile: () => api.get('/auth/me'),`;
  const replacement = `getProfile: () => api.get('/auth/me'),
  updateSettings: (settings: any) => api.patch('/auth/me/settings', { settings }),`;
  api = api.replace(target, replacement);
  fs.writeFileSync('client/src/lib/api.ts', api);
}
