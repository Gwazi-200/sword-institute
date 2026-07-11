# TODO Progress — Sword Institute (Course Unlock Flow)

- [x] Step 1. Add course unlocking rule UI on `courses.html` (default unlock only `PSWORD-MGMT-001`)
- [ ] Step 1.1 Add enrollment modal HTML + UI wiring in `courses.html`
- [ ] Step 1.2 Add click handler: locked course “Enroll” opens modal; modal submit enrolls + persists session fields + unlocks that course
- [ ] Step 1.3 Defensive navigation: prevent locked course content access
- [x] Step 2. Update `dashboard.html` defensively (duplicate ID selection fix + eligibility checks already present)
- [ ] Step 3. Extend `js/auth.js` session persistence to include `admissionNumber`, `name`, `phone`, `course`
- [ ] Step 4. Align enrollment payload writing in `js/enrollment-ui.js` (if needed)
- [ ] Step 5. Manual verification checklist

