# Error check / fix plan

- [ ] Identify conflicting dashboard scripts loaded by `dashboard.html` (likely legacy `js/dashboard.js` vs inline script + missing/empty modules).
- [ ] Verify DOM id mismatches (e.g., dashboard.js expecting `logout-btn` vs `logout-btn` in HTML, and student-name ids vs `userName`, etc.).
- [ ] Find runtime issues from console by running an app lint/build/test where available (or run local server + open devtools guidance).
- [ ] Fix the confirmed issues and remove/guard incompatible code paths.
- [ ] Smoke test: open `dashboard.html` in browser while logged in/out, ensure no JS errors and buttons work.

