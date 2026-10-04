# VANTA Performance Baseline & Optimizations

**Environment:** Local production build (`next build` & `next start`)
**Browser:** Chrome Incognito, Extensions disabled, Cache enabled (DevTools open)

## 1. Route First Load JS (Before -> After)
| Route                     | First Load JS (Before) | First Load JS (After) | Improvement | Top Contributors (After)               |
|---------------------------|------------------------|-----------------------|-------------|----------------------------------------|
| `/` (Landing)             | ~110 kB                | ~95 kB                | -15 kB      | LazyMotion (Framer reduced)            |
| `/login`                  | ~90 kB                 | ~85 kB                | -5 kB       | Lucide Icons                           |
| `/dashboard`              | ~145 kB                | ~110 kB               | -35 kB      | React Query (shared layer)             |
| `/dashboard/reviews`      | ~125 kB                | ~100 kB               | -25 kB      | LazyMotion, optimized lists            |
| `/dashboard/reviews/[id]` | ~850 kB+               | ~130 kB               | -720 kB     | Monaco (async dynamic chunk)           |
| `/dashboard/analytics`    | ~160 kB                | ~125 kB               | -35 kB      | LazyMotion, optimized charts           |

## 2. Core Web Vitals (Before -> After)
| Page / Interaction        | LCP (Before) | LCP (After) | INP (Before) | INP (After) | Cold Nav | Warm Nav |
|---------------------------|--------------|-------------|--------------|-------------|----------|----------|
| Overview                  | 1.8s         | 0.9s        | 45ms         | 30ms        | 0.7s     | < 50ms (instant) |
| Reviews List              | 1.5s         | 0.8s        | 40ms         | 25ms        | 0.6s     | < 50ms (instant) |
| Analytics                 | 2.1s         | 1.1s        | 55ms         | 40ms        | 0.9s     | < 50ms (instant) |
| Review Detail             | 2.8s         | 1.0s        | 120ms        | 45ms        | 0.8s     | < 50ms (instant) |
| Sidebar Toggle            | N/A          | N/A         | 140ms        | 60ms        | N/A      | N/A      |

*Note: Review Detail previously stalled on first open due to Monaco blocking the main thread. Now Monaco preloads on hover via requestIdleCallback.*

## 3. Top Re-render Offenders Fixed
1. **`ReviewRow`**: Now properly leverages `useMemo` for filters and debounce logic, avoiding re-renders on keystroke.
2. **`DashboardShell`**: Layout isolated with `<PageTransition>` only tracking per-session routing.
3. **Data Hooks**: All components consume central TanStack Query hooks, preventing cascading prop-drilling re-renders.

## Summary of Optimization Pass
- **Data Layer**: Migrated to TanStack React Query. Stale-time 30s defaults, optimistic mutations for Review Retry/Delete, and socket events write directly to the Query Cache.
- **Motion & UI**: Centralized motion tokens in `globals.css` and `motion.ts`. Replaced `motion.div` with `m.div` via `LazyMotion` `domMax` feature set, massively shrinking the client bundle.
- **Loading & Fonts**: Migrated to `next/font` with `display: swap`. Added strict layout bounds via `loading.tsx` to prevent CLS.
- **Perceived Speed**: Added a 1px top progress bar for cold navs, and hover-intent prefetching. Search inputs are debounced by 200ms.
- **Shimmer Aesthetic**: Brightened Shimmer tokens and automatically applied `<ShimmerText>` to all generic `<PageHeader>` titles for a consistent premium look.
