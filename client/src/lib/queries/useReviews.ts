
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi } from '../api';
import { toast } from '../toast';

export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
  list: (page: number) => [...reviewKeys.all, 'list', page] as const,
  detail: (id: string) => [...reviewKeys.all, 'detail', id] as const,
  analytics: () => [...reviewKeys.all, 'analytics'] as const,
};

export function useReviews(page = 1) {
  return useQuery({
    queryKey: reviewKeys.list(page),
    queryFn: async () => {
      const { data } = await reviewApi.list(page);
      return data.data || [];
    }
  });
}

export function useReview(id: string) {
  return useQuery({
    queryKey: reviewKeys.detail(id),
    queryFn: async () => {
      const { data } = await reviewApi.getById(id);
      return data.data;
    }
  });
}

export function useReviewAnalytics() {
  return useQuery({
    queryKey: reviewKeys.analytics(),
    queryFn: async () => {
      const { data } = await reviewApi.getAnalytics();
      return data.data;
    }
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewApi.deleteReview(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: reviewKeys.lists() });
      const previous = qc.getQueryData<any[]>(reviewKeys.list(1));
      if (previous) qc.setQueryData(reviewKeys.list(1), previous.filter(r => r.id !== id));
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) qc.setQueryData(reviewKeys.list(1), context.previous);
      toast.notify("Failed to delete review");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.lists() });
    }
  });
}

export function useRetryReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewApi.retryReview(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: reviewKeys.lists() });
      const previous = qc.getQueryData<any[]>(reviewKeys.list(1));
      if (previous) {
        qc.setQueryData(reviewKeys.list(1), previous.map(r => r.id === id ? { ...r, status: 'queued' } : r));
      }
      // Also optimistic update detail
      qc.setQueryData(reviewKeys.detail(id), (old: any) => old ? { ...old, status: 'queued' } : old);
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) qc.setQueryData(reviewKeys.list(1), context.previous);
      toast.notify("Failed to retry review");
    },
    onSettled: (data, err, id) => {
      qc.invalidateQueries({ queryKey: reviewKeys.lists() });
      qc.invalidateQueries({ queryKey: reviewKeys.detail(id) });
    }
  });
}
