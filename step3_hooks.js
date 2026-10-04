const fs = require('fs');
const dir = 'client/src/lib/queries';
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

// 1. useUser.ts
const userHooks = `
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api';

export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      const { data } = await authApi.getProfile();
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
`;
fs.writeFileSync(dir + '/useUser.ts', userHooks);

// 2. useRepos.ts
const repoHooks = `
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repoApi, reviewApi } from '../api';
import { toast } from '../toast';

export const repoKeys = {
  all: ['repos'] as const,
  connected: () => [...repoKeys.all, 'connected'] as const,
  github: (page: number) => [...repoKeys.all, 'github', page] as const,
  stats: () => [...repoKeys.all, 'stats'] as const,
};

export function useConnectedRepos() {
  return useQuery({
    queryKey: repoKeys.connected(),
    queryFn: async () => {
      const { data } = await repoApi.listConnected();
      return data.data || [];
    }
  });
}

export function useRepoStats() {
  return useQuery({
    queryKey: repoKeys.stats(),
    queryFn: async () => {
      const { data } = await reviewApi.getRepoStats();
      return data.data || {};
    }
  });
}

export function useConnectRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repoData: any) => repoApi.connect(repoData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: repoKeys.connected() });
      toast.notify("Repository connected", { label: "Dismiss" });
    },
    onError: () => toast.notify("Failed to connect repository")
  });
}

export function useDisconnectRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repoApi.disconnect(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: repoKeys.connected() });
      const previous = qc.getQueryData<any[]>(repoKeys.connected());
      if (previous) qc.setQueryData(repoKeys.connected(), previous.filter(r => r.id !== id));
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) qc.setQueryData(repoKeys.connected(), context.previous);
      toast.notify("Failed to disconnect repository");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: repoKeys.connected() });
    }
  });
}
`;
fs.writeFileSync(dir + '/useRepos.ts', repoHooks);

// 3. useReviews.ts
const reviewHooks = `
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
`;
fs.writeFileSync(dir + '/useReviews.ts', reviewHooks);
