const fs = require('fs');

let page = fs.readFileSync('client/src/app/dashboard/reviews/new/page.tsx', 'utf8');

// Ensure useAuthStore is imported
if (!page.includes('useAuthStore')) {
  page = page.replace("import { repoApi, reviewApi } from '@/lib/api';", "import { repoApi, reviewApi } from '@/lib/api';\nimport { useAuthStore } from '@/lib/auth';");
}

// Ensure user settings are grabbed
page = page.replace(
  "const [mode, setMode] = useState('standard');",
  "const { user } = useAuthStore();\n  const [mode, setMode] = useState((user as any)?.settings?.reviewMode || 'standard');"
);

// Pass customInstructions
const oldSubmit = `      const res = await reviewApi.create({
        repoId: selectedRepo.id,
        files: Object.values(fileContents),
        title: title || \`\${selectedRepo.name} Review\`,
        mode: mode,
      });`;

const newSubmit = `      const res = await reviewApi.create({
        repoId: selectedRepo.id,
        files: Object.values(fileContents),
        title: title || \`\${selectedRepo.name} Review\`,
        mode: mode,
        customInstructions: (user as any)?.settings?.customInstructions || '',
      });`;

page = page.replace(oldSubmit, newSubmit);
fs.writeFileSync('client/src/app/dashboard/reviews/new/page.tsx', page);
