import { buildGreetingSummary } from './utils';

describe('buildGreetingSummary', () => {
  it('returns first run message', () => {
    expect(buildGreetingSummary({ isFirstRun: true, failedThisWeek: 0, inProgress: 0, scoreTrend: 0, totalThisMonth: 0 }))
      .toBe('Welcome to VANTA. Connect a repository to start your first review.');
  });
  
  it('prioritizes failed reviews and score trend', () => {
    expect(buildGreetingSummary({ isFirstRun: false, failedThisWeek: 2, inProgress: 1, scoreTrend: 2.4, totalThisMonth: 40 }))
      .toBe('2 reviews failed this week · average score up 2.4 this month');
  });
  
  it('shows in progress if no failures', () => {
    expect(buildGreetingSummary({ isFirstRun: false, failedThisWeek: 0, inProgress: 1, scoreTrend: -1.2, totalThisMonth: 40 }))
      .toBe('1 review in progress · average score down 1.2 this month');
  });
  
  it('falls back to volume if only one primary fact', () => {
    expect(buildGreetingSummary({ isFirstRun: false, failedThisWeek: 0, inProgress: 0, scoreTrend: 2.0, totalThisMonth: 40 }))
      .toBe('average score up 2.0 this month · 40 reviews this month');
  });
  
  it('shows neutral state when no facts', () => {
    expect(buildGreetingSummary({ isFirstRun: false, failedThisWeek: 0, inProgress: 0, scoreTrend: 0, totalThisMonth: 0 }))
      .toBe('All systems normal · ready for review.');
  });
});
