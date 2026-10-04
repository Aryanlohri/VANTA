const fs = require('fs');

let socketFile = fs.readFileSync('client/src/lib/socket.ts', 'utf8');

const queryImports = `import { queryClient } from './queryClient';
import { reviewKeys } from './queries/useReviews';`;

if (!socketFile.includes('queryClient')) {
  socketFile = socketFile.replace("import { io, Socket } from 'socket.io-client';", "import { io, Socket } from 'socket.io-client';\n" + queryImports);
  
  // Actually, wait, updating the cache in socket.ts is great but `socket.ts` needs a way to throttle updates.
  // We can just add a simple throttle map.
  const throttleLogic = `
const progressThrottles = new Map<string, NodeJS.Timeout>();

function updateReviewCache(id: string, updater: (old: any) => any) {
  // Update detail
  const detailKey = reviewKeys.detail(id);
  const oldDetail = queryClient.getQueryData(detailKey);
  if (oldDetail) queryClient.setQueryData(detailKey, updater(oldDetail));
  
  // Update lists
  // This is a bit brute force for all lists, but usually there's only page 1 loaded locally
  const listKey = reviewKeys.list(1);
  const oldList = queryClient.getQueryData<any[]>(listKey);
  if (oldList) {
    queryClient.setQueryData(listKey, oldList.map(r => r.id === id ? updater(r) : r));
  }
}

export function subscribeToReview(reviewId: string) {
  if (!socket) return () => {};
  
  const room = \`review:\${reviewId}\`;
  socket.emit('subscribe', room);
  
  socket.on('progress', (data) => {
    if (data.reviewId !== reviewId) return;
    
    if (progressThrottles.has(reviewId)) return;
    
    progressThrottles.set(reviewId, setTimeout(() => {
      progressThrottles.delete(reviewId);
      updateReviewCache(reviewId, (old) => ({
        ...old,
        status: data.stage === 'completed' || data.stage === 'failed' ? data.stage : 'processing',
        progress: data
      }));
    }, 150)); // Coalesce to 150ms
  });
  
  return () => {
    socket?.emit('unsubscribe', room);
    socket?.off('progress');
  };
}
`;
  
  // Append or replace the subscribe logic
  if (!socketFile.includes('updateReviewCache')) {
    socketFile += '\n' + throttleLogic;
    fs.writeFileSync('client/src/lib/socket.ts', socketFile);
  }
}
