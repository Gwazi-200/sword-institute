/**
 * ============================================================
 * Sword Institute LMS
 * Course Service
 * Version: 3.0.0 (Production)
 * ============================================================
 *
 * Central service for all Firestore course operations.
 *
 * SINGLE RESPONSIBILITY:
 * This is the ONLY place that communicates with the
 * Firestore "courses" collection.
 *
 * All pages (Homepage, Dashboard, Catalogue, Lesson Player, Admin)
 * MUST import from this service.
 *
 * Features:
 * - Request caching (5-minute TTL)
 * - Query result normalization
 * - Comprehensive error handling
 * - Development logging
 * ============================================================
 */

import {
    db,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from '../firebase.js';

import {
    normalizeCourse,
    normalizeCourses
} from '../utils/courseNormalizer.js';

import { info, warn, error, debug, timer } from '../core/logger.js';

const MODULE = 'CourseService';

/* ============================================================
   CONSTANTS
============================================================ */

const COURSE_COLLECTION = 'courses';
const CACHE_TIME = 1000 * 60 * 5; // 5 minutes

/* ============================================================
   STATE
============================================================ */

let courseCache = [];
let lastLoaded = null;

/* ============================================================
   COLLECTION REFERENCE
============================================================ */

function coursesRef() {
    return collection(db, COURSE_COLLECTION);
}

/* ============================================================
   CACHE HELPERS
============================================================ */

function cacheValid() {
    if (!lastLoaded) return false;
    const age = Date.now() - lastLoaded;
    return age < CACHE_TIME;
}

function updateCache(courses) {
    courseCache = normalizeCourses(courses);
    lastLoaded = Date.now();
    info(MODULE, `Cache updated: ${courseCache.length} courses (TTL: 5m)`);
}

/* ============================================================
   LOAD ALL COURSES
============================================================ */

async function loadCourses(forceRefresh = false) {
    if (!forceRefresh && cacheValid()) {
        debug(MODULE, '⚡ Using cached courses');
        return courseCache;
    }

    const perf = timer(MODULE, 'loadCourses');

    try {
        info(MODULE, 'Fetching courses from Firestore...');

        const q = query(
            coursesRef(),
            where('published', '==', true),
            orderBy('title')
        );

        const snapshot = await getDocs(q);
        const courses = [];

        snapshot.forEach((doc) => {
            courses.push({
                id: doc.id,
                ...doc.data()
            });
        });

        updateCache(courses);
        info(MODULE, `✔ ${courseCache.length} published courses loaded`);
        return courseCache;
    } catch (err) {
        error(MODULE, 'Failed to load courses from Firestore', err);

        // Check for composite index error
        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
            error(MODULE, '⚠️ COMPOSITE INDEX REQUIRED: published + title orderBy');
            error(MODULE, 'Run: firebase firestore:indexes:create firestore.indexes.json');
        }

        // Return cached data if available, even if stale
        if (courseCache.length > 0) {
            warn(MODULE, 'Returning stale cached courses');
            return courseCache;
        }

        return [];
    } finally {
        perf.stop();
    }
}

/* ============================================================
   PUBLIC API
============================================================ */

export async function getAllCourses(forceRefresh = false) {
    return await loadCourses(forceRefresh);
}

/* ============================================================
   FEATURED COURSES
============================================================ */

export async function getFeaturedCourses(max = 8) {
    const courses = await loadCourses();
    return courses.filter((course) => course.featured).slice(0, max);
}

/* ============================================================
   POPULAR COURSES
============================================================ */

export async function getPopularCourses(max = 8) {
    const courses = await loadCourses();
    return courses.filter((course) => course.popular).slice(0, max);
}

/* ============================================================
   CATEGORY
============================================================ */

export async function getCoursesByCategory(category) {
    const courses = await loadCourses();
    return courses.filter(
        (course) => course.category === category
    );
}

/* ============================================================
   FEATURED COURSES
============================================================ */

export async function getFeaturedCourses(max = 8) {

    const courses = await loadCourses();

    return courses

        .filter(course => course.featured)

        .slice(0, max);

}

/* ============================================================
   POPULAR COURSES
============================================================ */

export async function getPopularCourses(max = 8) {

    const courses = await loadCourses();

    return courses

        .filter(course => course.popular)

        .slice(0, max);

}

/* ============================================================
   CATEGORY
============================================================ */

export async function getCoursesByCategory(category) {

    const courses = await loadCourses();

    return courses.filter(

        course => course.category === category

    );

}

/* ============================================================
   COURSE ID
============================================================ */

export async function getCourseById(courseId) {

    const courses = await loadCourses();

    return (

        courses.find(

            c => c.courseId === courseId

        ) || null

    );

}

/* ============================================================
   COURSE SLUG
============================================================ */

export async function getCourseBySlug(slug) {

    const courses = await loadCourses();

    return (

        courses.find(

            c => c.slug === slug

        ) || null

    );

}

/* ============================================================
   SEARCH
============================================================ */

export async function searchCourses(searchText = "") {

    const text = searchText.toLowerCase();

    const courses = await loadCourses();

    return courses.filter(course =>

        course.title.toLowerCase().includes(text) ||

        course.description.toLowerCase().includes(text) ||

        course.tags.join(" ").toLowerCase().includes(text)

    );

}

/* ============================================================
   REFRESH CACHE
============================================================ */

export async function refreshCourses() {

    return await loadCourses(true);

}

/* ============================================================
   CACHE INFO
============================================================ */

export function getCourseCache() {

    return courseCache;

}

/* ============================================================
   VERSION
============================================================ */

console.log("📚 Course Service v2.0 Loaded");