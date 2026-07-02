/**
 * ============================================================
 * Sword Institute LMS
 * Course Service
 * Version: 2.0.0
 * ============================================================
 *
 * This service is the ONLY place that communicates
 * with the Firestore "courses" collection.
 *
 * Homepage
 * Dashboard
 * Catalogue
 * Lesson Player
 * Admin Panel
 *
 * should NEVER query Firestore directly.
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
} from "../firebase.js";

import {
    normalizeCourse,
    normalizeCourses
} from "../utils/courseNormalizer.js";

/* ============================================================
   CONSTANTS
============================================================ */

const COURSE_COLLECTION = "courses";

/* ============================================================
   CACHE
============================================================ */

let courseCache = [];

let lastLoaded = null;

const CACHE_TIME = 1000 * 60 * 5; // 5 minutes

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

    return Date.now() - lastLoaded < CACHE_TIME;

}

function updateCache(courses) {

    courseCache = normalizeCourses(courses);

    lastLoaded = Date.now();

}

/* ============================================================
   LOAD ALL COURSES
============================================================ */

async function loadCourses(forceRefresh = false) {

    if (!forceRefresh && cacheValid()) {

        console.log("⚡ Using cached courses");

        return courseCache;

    }

    try {

        console.log("📚 Loading courses from Firestore...");

        const q = query(

            coursesRef(),

            where("published", "==", true),

            orderBy("title")

        );

        const snapshot = await getDocs(q);

        const courses = [];

        snapshot.forEach(doc => {

            courses.push({

                id: doc.id,

                ...doc.data()

            });

        });

        updateCache(courses);

        console.log(`✅ ${courseCache.length} courses loaded.`);

        return courseCache;

    }

    catch (error) {

        console.error("❌ Failed loading courses", error);

        return [];

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