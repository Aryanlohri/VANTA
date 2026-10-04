
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
      toast.notify("Repository connected", { label: "Dismiss", onClick: () => {} });
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
