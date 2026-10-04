import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#e8e8e8]">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[#898989] mt-1">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
