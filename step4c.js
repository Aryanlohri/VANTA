const fs = require('fs');

// 1. Update login page
let login = fs.readFileSync('client/src/app/login/page.tsx', 'utf8');
if (!login.includes('enableDemoMode')) {
  login = login.replace("import { authApi } from '@/lib/api';", "import { authApi } from '@/lib/api';\nimport { enableDemoMode } from '@/lib/demoData';");
  
  const targetBtn = `<button
            onClick={handleGitHubLogin}
            disabled={loginLoading}`;
  
  const newBtns = `<button
            onClick={handleGitHubLogin}
            disabled={loginLoading}
            className="w-full btn-metal flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-sm font-medium tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed mb-3"
          >
            <GitBranch size={18} strokeWidth={1.5} />
            {loginLoading ? 'Redirecting...' : 'Continue with GitHub'}
          </button>
          
          <button
            onClick={enableDemoMode}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-sm font-medium tracking-wider uppercase text-[#898989] border border-[var(--color-border)] hover:text-[#e8e8e8] hover:bg-white/5 transition-colors"
          >
            Try with sample data
          </button>`;
          
  login = login.replace(/<button\s+onClick=\{handleGitHubLogin\}[\s\S]*?<\/button>/, newBtns);
  fs.writeFileSync('client/src/app/login/page.tsx', login);
}

// 2. Update empty dashboard state (FirstRunGuide is already there, let's add it to the bottom of the guide or as a separate card)
let dash = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');
if (!dash.includes('enableDemoMode')) {
  dash = dash.replace("import { FirstRunGuide } from '@/components/ui/FirstRunGuide';", "import { FirstRunGuide } from '@/components/ui/FirstRunGuide';\nimport { enableDemoMode } from '@/lib/demoData';");
  
  // Actually, let's add it to the FirstRunGuide itself!
}

let guide = fs.readFileSync('client/src/components/ui/FirstRunGuide.tsx', 'utf8');
if (!guide.includes('enableDemoMode')) {
  guide = guide.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { enableDemoMode } from '@/lib/demoData';");
  
  // Add an absolute button in the FirstRunGuide
  const targetGuide = `</p>\n          </div>\n\n          <div className="grid`;
  const replacementGuide = `</p>\n          </div>\n          <button onClick={enableDemoMode} className="absolute top-4 right-12 px-3 py-1 bg-white/5 hover:bg-white/10 text-[#898989] hover:text-[#e8e8e8] rounded text-[11px] font-medium tracking-wide transition-colors">Try with sample data</button>\n\n          <div className="grid`;
  
  guide = guide.replace(targetGuide, replacementGuide);
  fs.writeFileSync('client/src/components/ui/FirstRunGuide.tsx', guide);
}
