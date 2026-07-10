# TODO

## Goal
Align any dashboard/nav visibility logic with the existing Firebase auth + Firestore enrollment gating (EnrollmentUI), not the simulated `userSession` snippet.

## Steps
1. Verify current dashboard-nav elements across pages (`index.html`, `courses.html`, others) and ensure visibility is controlled via `window.EnrollmentUI.hasActiveEnrollment`.
2. Implement/standardize a small helper call pattern: after Firebase `onAuthStateChanged`, call `EnrollmentUI.updateDashboardNav({ user })` (or equivalent selector-based update) so the Dashboard button is shown only when enrolled.
3. Ensure the EnrollmentUI default selector (`#dashboardBtn`) matches each page’s DOM; if not, pass `dashboardButtonSelector`.
4. Remove or prevent any legacy/simulated session code from interfering (if it exists in the repo and is wired anywhere).
5. Manual test checklist:
   - Logged out: Dashboard hidden.
   - Logged in but not enrolled: Dashboard hidden and direct navigation to `dashboard.html` redirects to courses.
   - Enrolled: Dashboard visible and dashboard loads.

