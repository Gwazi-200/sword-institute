/**
 * ============================================================
 * Sword Institute LMS
 * Homepage Featured Courses
 * Version: 1.0.0
 * ============================================================
 */

import { getFeaturedCourses } from "./services/courseService.js";

const container = document.getElementById("coursesContainer");

function escapeHTML(text = "") {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function createCourseCard(course) {
    const thumbnail = course.thumbnail || "images/courses/default-course.jpg";
    const duration = course.duration || course.length || "Self-paced";
    const difficulty = course.difficulty || "Beginner";
    const certificateBadge = course.certificate ? '<span class="course-badge"><i class="fas fa-award"></i> Certificate</span>' : '';

    return `
        <article class="course-card" aria-label="${escapeHTML(course.title)}">
            <img
                class="course-thumb"
                src="${thumbnail}"
                alt="${escapeHTML(course.title)}"
                loading="lazy"
                decoding="async"
                onerror="this.src='images/courses/default-course.jpg'"
            >
            <div class="course-body">
                <div class="course-badge-row">${certificateBadge}</div>
                <h4>${escapeHTML(course.title)}</h4>
                <p>${escapeHTML(course.shortDescription || course.description || "Practical learning designed for real-world impact.")}</p>
                <div class="course-meta">
                    <span><i class="fas fa-clock"></i> ${escapeHTML(duration)}</span>
                    <span><i class="fas fa-layer-group"></i> ${escapeHTML(difficulty)}</span>
                </div>
                <div class="course-footer">
                    <span class="text-muted">${escapeHTML(course.category || "Featured")}</span>
                    <a href="course.html?slug=${encodeURIComponent(course.slug || course.id)}" class="btn btn-outline-violet">Enroll</a>
                </div>
            </div>
        </article>
    `;
}

async function renderCourses() {
    if (!container) return;

    const existingCards = container.querySelectorAll('.course-card');
    if (existingCards.length) {
        existingCards.forEach((card) => card.remove());
    }

    container.innerHTML = `
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
    `;

    try {
        const courses = await getFeaturedCourses(4);

        if (!courses.length) {
            container.innerHTML = '<div class="empty-state"><h3>No featured courses available yet.</h3><p>Fresh courses will appear here as they are published.</p></div>';
            return;
        }

        container.innerHTML = courses.map(createCourseCard).join("");
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="empty-state"><h3>Unable to load featured courses.</h3><p>Please refresh and try again.</p></div>';
    }
}

document.addEventListener("DOMContentLoaded", renderCourses);
console.log("🏠 Homepage Course Loader Ready");