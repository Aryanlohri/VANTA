const fs = require('fs');

// 1. Create client/src/lib/queryClient.ts
const qc = `
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 404 || error?.response?.status === 401) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
`;
fs.writeFileSync('client/src/lib/queryClient.ts', qc);

// 2. Create client/src/lib/QueryProvider.tsx
const qp = `
'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { ReactNode } from 'react';

export default function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
`;
fs.writeFileSync('client/src/lib/QueryProvider.tsx', qp);

// 3. Update layout.tsx
let layout = fs.readFileSync('client/src/app/layout.tsx', 'utf8');
if (!layout.includes('QueryProvider')) {
  layout = layout.replace("import { ToastContainer }", "import QueryProvider from '@/lib/QueryProvider';\nimport { ToastContainer }");
  layout = layout.replace("<body", "<body");
  layout = layout.replace("{children}", "<QueryProvider>\n          {children}\n        </QueryProvider>");
  fs.writeFileSync('client/src/app/layout.tsx', layout);
}
