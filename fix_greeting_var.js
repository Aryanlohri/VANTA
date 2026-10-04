const fs = require('fs');

let dash = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');

if (!dash.includes('const greetingMsg = ')) {
  const insertTarget = "const reviews = useLiveReviews(initialReviews);";
  const replacement = `const reviews = useLiveReviews(initialReviews);

  const greetingMsg = buildGreetingSummary({
    failedThisWeek: reviews.filter((r: any) => r.status === 'failed').length,
    inProgress: reviews.filter((r: any) => r.status === 'processing' || r.status === 'queued').length,
    scoreTrend: repos.length > 0 ? 1.2 : 0,
    totalThisMonth: reviews.length,
    isFirstRun: !loading && repos.length === 0 && reviews.length === 0
  });`;

  dash = dash.replace(insertTarget, replacement);
  fs.writeFileSync('client/src/app/dashboard/page.tsx', dash);
}
