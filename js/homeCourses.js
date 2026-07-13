/**
 * ============================================================
 * Sword Institute LMS
 * Homepage Featured Courses
 * Version: 2.0.0 (Production)
 * ============================================================
 *
 * Features:
 * - Safe DOM manipulation
 * - Proper error handling with fallback UI
 * - Loading states with skeleton
 * - Empty state handling
 * - Retry on network failure
 * ============================================================
 */

import { getFeaturedCourses } from './services/courseService.js';
import {
    safeQuery,
    safeSetHTML,
    onDOMReady
} from './core/safe-dom.js';
import { info, warn, error, timer } from './core/logger.js';
import { pickFeaturedCourses } from './utils/courseNormalizer.js';

const MODULE = 'HomeCourses';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(text = '') {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Create course card HTML
 */
function createCourseCard(course) {
    const thumbnail = course.thumbnail || 'images/courses/default-course.jpg';
    const duration = course.duration || course.length || 'Self-paced';
    const difficulty = course.difficulty || 'Beginner';
    const certificateBadge = course.certificate
        ? '<span class="course-badge"><i class="fas fa-award"></i> Certificate</span>'
        : '';

    return `
        <article class="course-card" aria-label="${escapeHTML(course.title)}">
            <img
                class="course-thumb"
                src="${escapeHTML(thumbnail)}"
                alt="${escapeHTML(course.title)}"
                loading="lazy"
                decoding="async"
                onerror="this.src='images/courses/default-course.jpg'"
            >
            <div class="course-body">
                <div class="course-badge-row">${certificateBadge}</div>
                <h4>${escapeHTML(course.title)}</h4>
                <p>${escapeHTML(course.shortDescription || course.description || 'Practical learning designed for real-world impact.')}</p>
                <div class="course-meta">
                    <span><i class="fas fa-clock"></i> ${escapeHTML(duration)}</span>
                    <span><i class="fas fa-layer-group"></i> ${escapeHTML(difficulty)}</span>
                </div>
                <div class="course-footer">
                    <span class="text-muted">${escapeHTML(course.category || 'Featured')}</span>
                    <a href="course.html?slug=${encodeURIComponent(course.slug || course.id)}" class="btn btn-outline-violet">Enroll</a>
                </div>
            </div>
        </article>
    `;
}

/**
 * Create skeleton loader HTML
 */
function createSkeletonHTML() {
    return Array(4)
        .fill(0)
        .map(
            () => `
        <div class="course-card">
            <div class="skeleton skeleton-thumb"></div>
            <div class="course-body">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text skeleton-text-short"></div>
                <div class="course-meta course-meta-skeleton">
                    <span class="skeleton skeleton-meta"></span>
                    <span class="skeleton skeleton-meta skeleton-meta-short"></span>
                </div>
            </div>
        </div>
    `
        )
        .join('');
}

/**
 * Create empty state HTML
 */
function createEmptyStateHTML() {
    return `
        <div class="empty-state">
            <h3>No featured courses available yet.</h3>
            <p>Fresh courses will appear here as they are published.</p>
        </div>
    `;
}

/**
 * Create error state HTML with retry button
 */
function createErrorStateHTML(onRetry) {
    return `
        <div class="empty-state error-state">
            <h3>Unable to load featured courses</h3>
            <p>There was an error loading courses. Please check your connection and try again.</p>
            <button class="btn btn-outline-violet" id="retryCoursesBtn" style="margin-top: 16px;">
                <i class="fas fa-redo"></i> Retry
            </button>
        </div>
    `;
}

/**
 * Sleep for specified duration
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch courses with retry logic
 */
async function fetchCoursesWithRetry(maxCount = 4, retries = 0) {
    try {
        info(MODULE, `Fetching featured courses (attempt ${retries + 1}/${MAX_RETRIES})`);
        const courses = await getFeaturedCourses(maxCount);
        const featured = pickFeaturedCourses(courses, maxCount);
        return { success: true, courses: featured, error: null };
    } catch (err) {
        error(MODULE, `Failed to fetch courses (attempt ${retries + 1})`, err);

        if (retries < MAX_RETRIES - 1) {
            warn(MODULE, `Retrying in ${RETRY_DELAY_MS}ms...`);
            await sleep(RETRY_DELAY_MS);
            return fetchCoursesWithRetry(maxCount, retries + 1);
        }

        return { success: false, courses: [], error: err };
    }
}

/**
 * Render courses to container
 */
async function renderCourses() {
    const container = safeQuery('#coursesContainer');

    if (!container) {
        warn(MODULE, 'Courses container not found');
        return;
    }

    // Show skeleton loading state
    safeSetHTML(container, createSkeletonHTML());

    const perf = timer(MODULE, 'Course Render');

    try {
        // Fetch with retry logic
        const { success, courses, error: fetchError } = await fetchCoursesWithRetry(4);

        if (!success) {
            warn(MODULE, 'Failed to load courses after retries');
            safeSetHTML(container, createErrorStateHTML());

            // Attach retry handler
            const retryBtn = safeQuery('#retryCoursesBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => renderCourses());
            }

            return;
        }

        if (!courses || courses.length === 0) {
            info(MODULE, 'No featured courses available');
            safeSetHTML(container, createEmptyStateHTML());
            return;
        }

        // Render course cards
        const html = courses.map(createCourseCard).join('');
        safeSetHTML(container, html);

        info(MODULE, `✔ Rendered ${courses.length} featured courses`);
    } catch (err) {
        error(MODULE, 'Unexpected error during course render', err);
        safeSetHTML(container, createErrorStateHTML());

        // Attach retry handler
        const retryBtn = safeQuery('#retryCoursesBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => renderCourses());
        }
    } finally {
        perf.stop();
    }
}

/**
 * Initialize when DOM is ready
 */
async function initializeHomeCourses() {
    await onDOMReady();
    await renderCourses();
    info(MODULE, '✅ Home courses module ready');
}

initializeHomeCourses().catch(err => {
    error(MODULE, 'Initialization failed', err);
});