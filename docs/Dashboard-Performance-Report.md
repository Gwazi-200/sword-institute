# Dashboard Performance Report

## Current bottlenecks

The dashboard page currently mixes UI rendering, Firebase reads, AI initialization, and analytics updates inside one large script block. This creates several performance and maintainability issues:

1. Repeated Firestore access patterns
   - Enrollment data, course data, and user data are fetched in a way that can trigger multiple serial reads for the same dashboard view.

2. Serial course fetches
   - Each enrolled course is loaded one by one, which increases load time and adds noticeable latency.

3. Heavy initialization work
   - AI is initialized immediately even when the rest of the dashboard is still loading.

4. Large inline script logic
   - The page includes broad UI logic and data fetching inside the HTML file, making it harder to optimize and extend.

5. Lack of a shared dashboard cache
   - The dashboard does not yet have a single provider that can cache and reuse a normalized dashboard state.

## Refactor direction

The dashboard should be moved to a single service-driven flow:

- Dashboard page requests data from dashboardService
- dashboardService performs a single optimized fetch flow
- Results are cached for reuse
- UI components render progressively from the cached view model

This approach reduces duplicate reads, improves perceived speed, and makes the dashboard easier to scale.
