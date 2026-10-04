# VANTA Performance Baseline

**Environment:** Local production build (`next build` & `next start`)
**Browser:** Chrome Incognito, Extensions disabled, Cache enabled (DevTools open)

## 1. Route First Load JS (Baseline)
| Route                     | First Load JS | Top Contributors (Estimate)             |
|---------------------------|---------------|-----------------------------------------|
| `/` (Landing)             | ~110 kB       | Framer Motion                           |
| `/login`                  | ~90 kB        | Lucide Icons                            |
| `/dashboard`              | ~145 kB       | Recharts, Framer Motion, date-fns       |
| `/dashboard/reviews`      | ~125 kB       | Framer Motion, Shared components        |
| `/dashboard/reviews/[id]` | ~850 kB+      | Monaco Editor (unsplit), Socket.io      |
| `/dashboard/analytics`    | ~160 kB       | Recharts, heavy SVG charts              |

## 2. Core Web Vitals (Baseline Estimates)
| Page / Interaction        | LCP   | CLS   | INP   | Route-Change (Warm) | Route-Change (Cold) |
|---------------------------|-------|-------|-------|---------------------|---------------------|
| Overview                  | 1.8s  | 0.08  | 45ms  | 400ms               | 1.2s                |
| Reviews List              | 1.5s  | 0.04  | 40ms  | 350ms               | 1.0s                |
| Analytics                 | 2.1s  | 0.12  | 55ms  | 500ms               | 1.5s                |
| Review Detail             | 2.8s  | 0.15  | 120ms | 800ms (stall)       | 2.5s                |
| Sidebar Toggle            | N/A   | 0.06  | 140ms | N/A                 | N/A                 |

## 3. Top Re-render Offenders (React Profiler)
1. **`ReviewRow`**: Re-rendering on global context changes or parent hover states (unmemoized).
2. **`Sidebar`**: Reflowing heavy children on width toggle.
3. **`DashboardShell`**: Mounting `NotificationBell` triggering global layout re-calc on updates.
4. **Charts in Analytics**: Re-animating unnecessarily on data refetches.
