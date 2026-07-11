# TODO — Sword Institute: Course Unlocking + Enrollment Modal

## Step 1 — Implement enrollment modal + locked/unlocked course rules in `courses.html`
- Ensure only `PSWORD-MGMT-001` (Professor SWORD Academy) is unlocked by default.
- Add enrollment modal (Admission Number, Name, Phone) for locked courses.
- On submit: validate inputs, enroll in Firestore via `window.EnrollmentUI.enrollUserInCourse`, persist `userSession` fields, re-render course list and update navigation.
- Disable navigation to locked courses and ensure smooth UX.

## Step 2 — Update `dashboard.html` enrollment gating + defensive navigation
- Ensure dashboard only appears after active enrollment.
- Add rerender/refresh logic after enrollment.
- Fix duplicated IDs / navigation elements that may break vault disappearance.

## Step 3 — Extend session handling in `js/auth.js`
- Add helpers to get/save `userSession` with: `admissionNumber`, `name`, `phone`, `course`.
- Ensure logout clears session fields.

## Step 4 — Extend/align enrollment writing in `js/enrollment-ui.js`
- Ensure enrollment doc is created/updated and availability is consistent.
- (Optional) store admissionNumber/name/phone into enrollment doc if desired by gating.

## Step 5 — Verify end-to-end behavior (manual)
- Logged out: only PSWORD-MGMT-001 accessible.
- Logged in but not enrolled: only PSWORD-MGMT-001 accessible; dashboard hidden.
- Click Enroll on locked course: modal opens; submit unlocks that specific course; dashboard unlocks.

