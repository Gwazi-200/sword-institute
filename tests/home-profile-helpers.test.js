const test = require('node:test');
const assert = require('node:assert/strict');

(async () => {
  const { pickFeaturedCourses, getFallbackCourses } = await import('../js/utils/courseNormalizer.js');
  const { buildProfileUpdatePayload } = await import('../js/utils/profileCenterUtils.js');

  test('pickFeaturedCourses falls back to the first courses when no explicit featured flags exist', () => {
    const courses = [
      { title: 'Alpha', featured: false, popular: false },
      { title: 'Beta', featured: false, popular: false },
      { title: 'Gamma', featured: false, popular: false },
    ];

    const result = pickFeaturedCourses(courses, 2);

    assert.equal(result.length, 2);
    assert.deepEqual(result.map((course) => course.title), ['Alpha', 'Beta']);
  });

  test('buildProfileUpdatePayload trims and normalizes profile values', () => {
    const payload = buildProfileUpdatePayload({
      fullName: '  Jane Doe  ',
      phone: '  ',
      country: 'Nigeria',
      profession: '',
      organization: '  Sword Labs  ',
      bio: '  Ready to learn  ',
      photoURL: '',
    });

    assert.deepEqual(payload, {
      fullName: 'Jane Doe',
      phone: '',
      country: 'Nigeria',
      profession: '',
      organization: 'Sword Labs',
      bio: 'Ready to learn',
      photoURL: '',
    });
  });

  test('getFallbackCourses returns curated featured course data', () => {
    const fallback = getFallbackCourses();

    assert.ok(Array.isArray(fallback));
    assert.ok(fallback.length > 0);
    assert.ok(fallback.some((course) => course.featured || course.popular));
    assert.ok(fallback[0].title);
  });
})();
