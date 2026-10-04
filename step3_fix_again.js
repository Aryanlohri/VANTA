const fs = require('fs');

// 1. Fix socket.ts
let sock = fs.readFileSync('client/src/lib/socket.ts', 'utf8');

const targetSocketEnd = "return { socket: socketRef, onEvent };\n}";
const newSocketEnd = `  // Intercept 'progress' events to update query cache
  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;
    
    const throttles = new Map<string, NodeJS.Timeout>();
    
    const handler = (data: any) => {
      const id = data.reviewId;
      if (!id) return;
      if (throttles.has(id)) return;
      
      throttles.set(id, setTimeout(() => {
        throttles.delete(id);
        const detailKey = reviewKeys.detail(id);
        const oldDetail = queryClient.getQueryData(detailKey);
        if (oldDetail) {
          queryClient.setQueryData(detailKey, { ...oldDetail, status: data.stage === 'completed' || data.stage === 'failed' ? data.stage : 'processing', progress: data });
        }
        
        const listKey = reviewKeys.list(1);
        const oldList = queryClient.getQueryData<any[]>(listKey);
        if (oldList) {
          queryClient.setQueryData(listKey, oldList.map(r => r.id === id ? { ...r, status: data.stage === 'completed' || data.stage === 'failed' ? data.stage : 'processing', progress: data } : r));
        }
      }, 150));
    };
    
    socket.on('progress', handler);
    return () => { socket.off('progress', handler); };
  }, []);

  return { socket: socketRef, onEvent };
}
`;

sock = sock.replace(targetSocketEnd, newSocketEnd);
sock = sock.replace(/const progressThrottles[\s\S]*subscribeToReview[\s\S]*\}\n/m, '');
fs.writeFileSync('client/src/lib/socket.ts', sock);

// 2. Fix dashboard/page.tsx
let dash = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');
// Let's rewrite dashboard/page.tsx completely because I made a mess of it with regex replacements.
// Wait, I can just use `sed` or replace on the specific lines.
dash = dash.replace(/const loading = true;[\s\S]*?(?=export default function DashboardPage\(\) \{)/m, '');
// Let's remove duplicate declarations.
dash = dash.replace(/const \[reviews, setReviews\] = useState<any\[\]>\(\[\]\);\n/g, '');
dash = dash.replace(/const \[loading, setLoading\] = useState\(true\);\n/g, '');
dash = dash.replace(/const \[repos, setRepos\] = useState<any\[\]>\(\[\]\);\n/g, '');
dash = dash.replace(/useEffect\(\(\) => \{\n\s+load\(\);\n\s+\}, \[\]\);\n/g, '');
dash = dash.replace(/async function load\(\) \{[\s\S]*?setLoading\(false\);\n\s+\}\n/g, '');
fs.writeFileSync('client/src/app/dashboard/page.tsx', dash);

// 3. Fix useRepos.ts
let useRepos = fs.readFileSync('client/src/lib/queries/useRepos.ts', 'utf8');
useRepos = useRepos.replace(/toast\.notify\("Repository connected", \{ label: "Dismiss" \}\);/g, 'toast.notify("Repository connected", { label: "Dismiss", onClick: () => {} });');
fs.writeFileSync('client/src/lib/queries/useRepos.ts', useRepos);
