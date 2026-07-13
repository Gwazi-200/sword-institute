/**
 * ============================================================
 * Sword Institute LMS
 * Course Normalizer
 * Version: 1.0.0
 * ============================================================
 *
 * Converts raw Firestore course documents into
 * consistent, validated course objects.
 *
 * This file contains NO Firestore queries.
 * It only cleans and validates course data.
 * ============================================================
 */

/**
 * Default course values
 */
const DEFAULT_COURSE = {

    courseId: "",

    title: "Untitled Course",

    slug: "",

    shortDescription: "",

    description: "",

    category: "General",

    subcategory: "",

    level: "Beginner",

    language: "English",

    duration: "Self-paced",

    estimatedHours: 0,

    lessons: 0,

    rating: 4.8,

    students: 0,

    progress: 0,

    featured: false,

    popular: false,

    published: true,

    certificate: true,

    price: 0,

    currency: "USD",

    thumbnail: "images/courses/default-course.jpg",

    image: "images/courses/default-course.jpg",

    banner: "images/courses/default-banner.jpg",

    instructor: "Sword Institute",

    instructorTitle: "Lead Instructor",

    skills: [],

    requirements: [],

    modules: [],

    tags: [],

    createdAt: null,

    updatedAt: null

};

/**
 * Restrict rating to 0–5
 */
function normalizeRating(value) {

    const rating = Number(value);

    if (Number.isNaN(rating)) return DEFAULT_COURSE.rating;

    return Math.min(Math.max(rating, 0), 5);

}

/**
 * Prevent negative numbers
 */
function positiveNumber(value, fallback = 0) {

    const number = Number(value);

    if (Number.isNaN(number) || number < 0) {

        return fallback;

    }

    return number;

}

/**
 * Ensure arrays
 */
function ensureArray(value) {

    return Array.isArray(value) ? value : [];

}

/**
 * Normalize one course
 */
export function normalizeCourse(course = {}) {

    return {

        ...DEFAULT_COURSE,

        ...course,

        title:

            course.title?.trim() ||

            DEFAULT_COURSE.title,

        slug:

            course.slug?.trim() ||

            "",

        rating:

            normalizeRating(course.rating),

        students:

            positiveNumber(course.students),

        progress:

            positiveNumber(course.progress),

        estimatedHours:

            positiveNumber(course.estimatedHours),

        lessons:

            positiveNumber(course.lessons),

        price:

            positiveNumber(course.price),

        skills:

            ensureArray(course.skills),

        requirements:

            ensureArray(course.requirements),

        modules:

            ensureArray(course.modules),

        tags:

            ensureArray(course.tags),

        thumbnail:

            course.thumbnail ||

            DEFAULT_COURSE.thumbnail,

        image:

            course.image ||

            DEFAULT_COURSE.image,

        banner:

            course.banner ||

            DEFAULT_COURSE.banner

    };

}

/**
 * Normalize multiple courses
 */
export function normalizeCourses(courses = []) {

    return courses.map(normalizeCourse);

}

export function pickFeaturedCourses(courses = [], max = 4) {
    const normalized = normalizeCourses(courses);
    const featured = normalized.filter((course) => Boolean(course.featured || course.popular));

    if (featured.length > 0) {
        return featured.slice(0, max);
    }

    return normalized.slice(0, max);
}

export function getFallbackCourses() {
    return [
        {
            title: 'AI Foundations',
            slug: 'ai-foundations',
            shortDescription: 'Build practical AI fluency with hands-on lessons and responsible usage patterns.',
            description: 'Learn the essentials of modern AI tools, prompt design, and everyday automation.',
            category: 'AI',
            level: 'Beginner',
            duration: '4 weeks',
            featured: true,
            popular: true,
            thumbnail: 'images/courses/default-course.jpg'
        },
        {
            title: 'Community Leadership Essentials',
            slug: 'community-leadership-essentials',
            shortDescription: 'Strengthen planning, coordination, and community-centered delivery.',
            description: 'Learn how to lead constructive change in teams, communities, and organizations.',
            category: 'Leadership',
            level: 'Beginner',
            duration: '3 weeks',
            featured: true,
            popular: false,
            thumbnail: 'images/courses/default-course.jpg'
        },
        {
            title: 'Digital Productivity Skills',
            slug: 'digital-productivity-skills',
            shortDescription: 'Use essential digital tools to work faster and with more confidence.',
            description: 'Develop practical digital habits for collaboration, organization, and everyday productivity.',
            category: 'Digital Skills',
            level: 'Beginner',
            duration: '2 weeks',
            featured: true,
            popular: false,
            thumbnail: 'images/courses/default-course.jpg'
        }
    ];
}

/**
 * Version log
 */
console.log("🧹 Course Normalizer Loaded");