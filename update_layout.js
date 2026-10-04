const fs = require('fs');
let content = fs.readFileSync('client/src/app/layout.tsx', 'utf8');
if (!content.includes('ToastContainer')) {
  content = content.replace('export default function RootLayout', "import { ToastContainer } from '@/components/ui/Toast';\n\nexport default function RootLayout");
  content = content.replace('{children}', '{children}\n        <ToastContainer />');
  fs.writeFileSync('client/src/app/layout.tsx', content);
}
