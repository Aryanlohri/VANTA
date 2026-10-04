const fs = require('fs');

['client/src/app/dashboard/reviews/page.tsx', 'client/src/app/dashboard/page.tsx'].forEach(path => {
  let content = fs.readFileSync(path, 'utf8');
  
  const target = `async function retryReview(id: string) {
    console.log('Retry review stub:', id);
    // TODO: implement retry API endpoint
  }`;
  
  const replacement = `async function retryReview(id: string) {
    try {
      await reviewApi.retryReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'processing' } : r));
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }`;
  
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content);
});
