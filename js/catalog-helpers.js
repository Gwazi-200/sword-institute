(function (globalScope) {
  'use strict';

  function normalizeId(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function getEnrollmentEligibleCourseIds(courses) {
    if (!Array.isArray(courses)) return [];
    return courses
      .filter(function (course) {
        return course && !course.externalUrl;
      })
      .map(function (course) {
        return course.id;
      })
      .filter(function (id) {
        return normalizeId(id) !== '';
      });
  }

  function mergeCuratedCourses(existingCourses, curatedCourses) {
    var safeExisting = Array.isArray(existingCourses) ? existingCourses.slice() : [];
    var safeCurated = Array.isArray(curatedCourses) ? curatedCourses.slice() : [];

    var existingIds = new Set(
      safeExisting
        .map(function (course) {
          return normalizeId(course && course.id);
        })
        .filter(Boolean)
    );

    var curatedToInsert = safeCurated.filter(function (course) {
      var id = normalizeId(course && course.id);
      return id && !existingIds.has(id);
    });

    return curatedToInsert.concat(safeExisting);
  }

  function getCourseHref(course) {
    if (course && typeof course.externalUrl === 'string' && course.externalUrl.trim()) {
      return course.externalUrl.trim();
    }

    var id = normalizeId(course && course.id);

    if (typeof window !== 'undefined' && window.SwordRoutes && typeof window.SwordRoutes.path === 'function') {
      return window.SwordRoutes.path('courseView', { query: { id: id } });
    }

    return 'course-view.html?id=' + encodeURIComponent(id);
  }

  var api = {
    getEnrollmentEligibleCourseIds: getEnrollmentEligibleCourseIds,
    mergeCuratedCourses: mergeCuratedCourses,
    getCourseHref: getCourseHref,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.catalogHelpers = api;
})(typeof window !== 'undefined' ? window : globalThis);
