## TODO (progress tracker)

- [ ] Diagnose runtime errors / console errors across pages.
- [x] Fix missing import path in `js/services/courseService.js` (was importing non-existent `./firebase.js`).
- [ ] Review course catalog flow: ensure only one course-catalog script is used per page.
- [x] Fix any remaining null dereferences by adding DOM-guards in UI scripts.

- [ ] Run a local build/lint (if available) and verify no console errors.

## Work steps I’m currently doing
- [ ] 1) Update `js/course-catalog.js`: unify imports via `js/firebase.js`.
- [ ] 2) Add null-guards in `js/course-catalog.js` for all DOM references.
- [ ] 3) Fix load-more/pagination flow in `js/course-catalog.js`.
- [ ] 4) Re-run `node --check` on updated files.

