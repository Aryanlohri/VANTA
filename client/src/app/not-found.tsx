import Link from 'next/link';
import { VantaMark } from '@/components/ui/VantaMark';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <VantaMark size={40} className="mb-6 opacity-40 grayscale" />
      <h2 className="text-[15px] font-semibold text-[#e8e8e8] mb-2 tracking-wide">Page not found</h2>
      <p className="text-[13px] text-[#898989] max-w-sm mx-auto mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-[#0a0a0a] border border-[var(--color-border)] rounded-md text-[13px] font-medium text-[#e8e8e8] hover:bg-white/5 transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}