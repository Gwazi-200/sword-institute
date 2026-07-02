/**
 * ============================================================
 * Sword Institute LMS
 * Homepage Featured Courses
 * Version: 1.0.0
 * ============================================================
 */

import { getFeaturedCourses } from "./services/courseService.js";

const container = document.getElementById("featuredCourses");

/**
 * Escape HTML
 */
function escapeHTML(text = "") {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Build one course card
 */
function createCourseCard(course) {

    return `
        <article class="programme-card">

            <img
                class="programme-image"
                src="${course.thumbnail}"
                alt="${escapeHTML(course.title)}"
                loading="lazy"
                onerror="this.src='images/courses/default-course.jpg'"
            >

            <div class="programme-content">

                <span class="tag">
                    ${escapeHTML(course.category)}
                </span>

                <h3>
                    ${escapeHTML(course.title)}
                </h3>

                <p>
                    ${escapeHTML(course.shortDescription)}
                </p>

                <div class="course-meta">

                    <span>⭐ ${course.rating}</span>

                    <span>📚 ${course.lessons} Lessons</span>

                </div>

                <div class="course-meta">

                    <span>⏱ ${course.duration}</span>

                    <span>👥 ${course.students}</span>

                </div>

                <div class="programme-footer">

                    <strong>

                        ${
                            course.certificate
                                ? "🎓 Certificate"
                                : ""

                        }

                    </strong>

                    <a
                        href="course.html?slug=${course.slug}"
                        class="btn btn-primary"
                    >

                        View Course

                    </a>

                </div>

            </div>

        </article>
    `;
}

/**
 * Render courses
 */
async function renderCourses() {

    if (!container) return;

    container.innerHTML = `
        <div class="loading-courses">

            <div class="loader"></div>

            <p>Loading Professional Programmes...</p>

        </div>
    `;

    try {

        const courses = await getFeaturedCourses();

        if (!courses.length) {

            container.innerHTML = `

                <div class="empty-state">

                    <h3>No Featured Courses</h3>

                    <p>
                        Featured courses will appear here once published.
                    </p>

                </div>

            `;

            return;

        }

        container.innerHTML = courses
            .map(createCourseCard)
            .join("");

    }

    catch (error) {

        console.error(error);

        container.innerHTML = `

            <div class="empty-state">

                <h3>Unable to Load Courses</h3>

                <p>
                    Please refresh the page and try again.
                </p>

            </div>

        `;

    }

}

/**
 * Initialise
 */
document.addEventListener("DOMContentLoaded", renderCourses);

console.log("🏠 Homepage Course Loader Ready");