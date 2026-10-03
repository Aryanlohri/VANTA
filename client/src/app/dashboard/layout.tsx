import { cookies } from 'next/headers';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const collapsed = cookieStore.get('sidebar:collapsed')?.value === 'true';

  return (
    <DashboardShell defaultCollapsed={collapsed}>
      {children}
    </DashboardShell>
  );
}
