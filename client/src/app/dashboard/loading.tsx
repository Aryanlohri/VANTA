
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="animate-in fade-in duration-300">
      <PageHeader title="Loading..." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[124px] rounded-2xl w-full" delay={false} />)}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-[68px] rounded-2xl w-full" delay={false} />)}
      </div>
    </div>
  );
}
