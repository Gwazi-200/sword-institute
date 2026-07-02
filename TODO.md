# TODO

## Dashboard fixes
- [x] Confirm mismatch between `dashboard.html` DOM IDs and `js/dashboard.js` referenced IDs.

- [ ] Update `js/dashboard.js` to use IDs that exist in `dashboard.html` (prevent null deref crashes).
- [x] Added `js/dashboard-fixed.js` and switched `dashboard.html` to it to prevent null deref crashes.

- [ ] Wire AI mentor panel logic to the correct IDs/classes used in `dashboard.html` (or add guards).
- [ ] Fix auth visibility toggling to match what `dashboard.html` actually contains (e.g., `nav-logout`).
- [ ] Verify dashboard loads without JS console errors (manual browser check).

