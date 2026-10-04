'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useDebounce } from '@/lib/useDebounce';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileCode, Plus, Search } from 'lucide-react';
import { reviewApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { ReviewRow } from '@/components/dashboard/ReviewRow';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';

export default function ReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const filter = searchParams.get('filter') || 'all';
  const search = searchParams.get('q') || '';
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await reviewApi.list();
        setReviews(res.data.data || []);
      } catch { /* service may not be running */ }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function setFilterAndSearch(newFilter: string, newSearch: string) {
    const params = new URLSearchParams();
    if (newFilter !== 'all') params.set('filter', newFilter);
    if (newSearch) params.set('q', newSearch);
    
    const queryString = params.toString();
    router.replace(queryString ? `/dashboard/reviews?${queryString}` : '/dashboard/reviews', { scroll: false });
  }

  const filtered = useMemo(() => reviews.filter((r: any) => {
    const matchesStatus = filter === 'all' || r.status === filter;
    const matchesSearch = !search || (r.title || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  }), [reviews, filter, search]);

  const getCount = (status: string) => {
    if (status === 'all') return reviews.length;
    return reviews.filter(r => r.status === status).length;
  };

  async function deleteReview(id: string) {
    try {
      await reviewApi.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }
  
  async function retryReview(id: string) {
    try {
      await reviewApi.retryReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'processing' } : r));
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle={`${filtered.length} total ${filtered.length === 1 ? 'review' : 'reviews'}`}
        action={
          <Link href="/dashboard/reviews/new"
            className="btn-metal flex items-center justify-center gap-2 px-5 h-10 rounded-lg text-[13px] font-medium tracking-wider uppercase"
          >
            <Plus size={16} strokeWidth={1.5} />
            New Review
          </Link>
        }
      />

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row items-center gap-3 mb-8">
        <div className="relative w-full md:w-64 shrink-0 group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616161] group-focus-within:text-[#e8e8e8] transition-colors" />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setFilterAndSearch(filter, e.target.value)}
            placeholder="Search reviews..."
            className="w-full pl-9 pr-8 h-9 rounded-lg text-[13px] outline-none transition-all bg-[#0a0a0a] border border-[var(--color-border)] focus:border-[#494949] text-[#e8e8e8] placeholder:text-[#616161]"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#616161] border border-[var(--color-border)] bg-white/5 rounded px-1.5 py-0.5 pointer-events-none">
            /
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full">
          {['all', 'pending', 'processing', 'completed', 'failed'].map((f) => {
            const count = getCount(f);
            const isActive = filter === f;
            return (
              <button key={f} onClick={() => setFilterAndSearch(f, search)}
                className={cn(
                  "flex items-center gap-2 px-3 h-9 rounded-lg text-[11px] font-medium tracking-wider uppercase transition-all whitespace-nowrap border",
                  isActive 
                    ? "bg-white/10 text-[#e8e8e8] border-white/10" 
                    : "bg-[#050505] text-[#616161] border-[var(--color-border)] hover:bg-white/5 hover:text-[#898989]"
                )}
              >
                {f}
                <span className={cn(
                  "tabular-nums text-[10px] px-1.5 py-0.5 rounded",
                  isActive ? "bg-white/10 text-[#e8e8e8]" : "bg-white/5 text-[#616161]"
                )}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-[12px]">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton className="h-[68px] w-full rounded-[16px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border border-[var(--color-border)] bg-[#050505]">
            <FileCode size={28} className="text-[#616161]" />
          </div>
          <p className="text-sm font-medium mb-1 text-[#e8e8e8]">
            {filter === 'all' && !search ? 'No reviews yet' : 'No results found'}
          </p>
          <p className="text-[13px] text-[#616161]">
            {filter === 'all' && !search 
              ? 'Submit your code for AI-powered analysis' 
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-[12px] stagger">
          {filtered.map((review: any) => (
            <ReviewRow 
              key={review.id} 
              review={review} 
              allReviews={reviews} 
              showDelete={true}
              onDelete={deleteReview}
              onRetry={retryReview}
            />
          ))}
        </div>
      )}
    </div>
  );
}
