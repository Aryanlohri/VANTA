const fs = require('fs');

let shell = fs.readFileSync('client/src/components/dashboard/DashboardShell.tsx', 'utf8');

if (!shell.includes('LiveTabManager')) {
  shell = shell.replace("import { NotificationBell } from '@/components/ui/NotificationBell';", "import { NotificationBell } from '@/components/ui/NotificationBell';\nimport { LiveTabManager } from '@/components/ui/LiveTabManager';");
  
  // Add a simple hook inside DashboardShell
  const targetHook = "export function DashboardShell({ children }: DashboardShellProps) {";
  const newHook = `export function DashboardShell({ children }: DashboardShellProps) {
  const [activeReviews, setActiveReviews] = useState(false);
  const [completedReview, setCompletedReview] = useState(false);
  
  useEffect(() => {
    // In a real app, listen to the socket here. For now we listen to eventStore.
    return eventStore.subscribe((events) => {
      const active = events.some(e => e.type === 'system' && e.title === 'Review Started'); // Mock active state
      const completed = events.some(e => e.type === 'review_completed' && (new Date().getTime() - new Date(e.timestamp).getTime() < 5000));
      setActiveReviews(active);
      setCompletedReview(completed);
    });
  }, []);
`;
  shell = shell.replace(targetHook, newHook);
  shell = shell.replace("<NotificationBell />", "<LiveTabManager hasActiveReviews={activeReviews} hasCompletedReview={completedReview} />\n            <NotificationBell />");
  
  // Need eventStore imported in shell
  if (!shell.includes("import { eventStore")) {
    shell = shell.replace("import { NotificationBell", "import { eventStore } from '@/lib/events';\nimport { NotificationBell");
  }
  
  fs.writeFileSync('client/src/components/dashboard/DashboardShell.tsx', shell);
}
