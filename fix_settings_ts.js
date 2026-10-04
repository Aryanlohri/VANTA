const fs = require('fs');

let page = fs.readFileSync('client/src/app/dashboard/settings/page.tsx', 'utf8');

// Fix toast
page = page.replace(/toast\.success/g, 'toast.notify');
page = page.replace(/toast\.error/g, 'toast.notify');

// Fix user.settings by casting to any
page = page.replace(/user\?\.settings\?/g, '(user as any)?.settings?');
page = page.replace(/useAuthStore\.setState\(\{ user: \{ \.\.\.user, settings \} \}\);/g, 'useAuthStore.setState({ user: { ...user, settings } as any });');

fs.writeFileSync('client/src/app/dashboard/settings/page.tsx', page);
