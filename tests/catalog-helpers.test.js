const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getEnrollmentEligibleCourseIds,
  mergeCuratedCourses,
  getCourseHref,
} = require('../js/catalog-helpers.js');

test('getEnrollmentEligibleCourseIds excludes external courses and empty IDs', () => {
  const result = getEnrollmentEligibleCourseIds([
    { id: 'COMM001' },
    { id: 'PSWORD-MGMT-001', externalUrl: 'management-mastery-academy.html' },
    { id: '' },
    { id: null },
    { id: ' AI001 ' },
  ]);

  assert.deepEqual(result, ['COMM001', ' AI001 ']);
});

test('mergeCuratedCourses prepends only curated courses missing from firestore list', () => {
  const existing = [
    { id: 'COMM001', title: 'Communication Skills' },
    { id: 'PSWORD-MGMT-001', title: 'Professor SWORD Academy (from db)' },
  ];

  const curated = [
    { id: 'PSWORD-MGMT-001', title: 'Professor SWORD Academy (local)' },
    { id: 'AI001', title: 'AI Basic Education (local)' },
  ];

  const merged = mergeCuratedCourses(existing, curated);

  assert.equal(merged.length, 3);
  assert.equal(merged[0].id, 'AI001');
  assert.equal(merged[1].id, 'COMM001');
  assert.equal(merged[2].id, 'PSWORD-MGMT-001');
});

test('getCourseHref returns external URL when provided', () => {
  const href = getCourseHref({ id: 'PSWORD-MGMT-001', externalUrl: 'management-mastery-academy.html' });
  assert.equal(href, 'management-mastery-academy.html');
});

test('getCourseHref falls back to course-view link and encodes ID', () => {
  const href = getCourseHref({ id: 'AI 001/Intro' });
  assert.equal(href, 'course-view.html?id=AI%20001%2FIntro');
});
