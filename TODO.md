# TODO

## Dashboard fixes
- [x] Confirm mismatch between `dashboard.html` DOM IDs and `js/dashboard.js` referenced IDs.

- [x] Update `js/dashboard.js` import + DOM access so it matches `dashboard.html` and avoids null deref crashes.
- [x] Added `js/dashboard-fixed.js` as reference/legacy patch.

- [x] Wire AI mentor panel logic to the correct IDs/classes used in `dashboard.html` (with guards).
- [x] Fix auth visibility toggling to match what `dashboard.html` actually contains (e.g., `nav-logout`).
- [ ] Verify dashboard loads without JS console errors (manual browser check).



