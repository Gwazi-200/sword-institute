/**
 * ============================================================
 * Sword Institute LMS
 * Course Page Integration Module
 * Version: 1.0.0
 * ============================================================
 *
 * Integration module for adding related resources to course pages.
 *
 * Provides:
 * - Related resources recommendations
 * - Resources by type/difficulty
 * - Resource download/bookmark buttons
 *
 * ============================================================
 */

import { searchResources } from "../services/resourceService.js";
import { getSimilarResources } from "../services/recommendationService.js";
import { saveResource, likeResource } from "../services/bookmarkService.js";

/**
 * Course page integration manager
 */
class CourseIntegration {
    constructor(courseData, options = {}) {
        this.courseData = courseData;
        this.courseId = courseData.id;
        this.courseTitle = courseData.title || "Course";
        this.options = {
            showRelatedResources: options.showRelatedResources !== false,
            showResourcesByType: options.showResourcesByType !== false,
            relatedResourcesLimit: options.relatedResourcesLimit || 6,
            maxTypes: options.maxTypes || 3,
        };
        this.resources = [];
    }

    /**
     * Load related resources for course
     */
    async loadRelatedResources() {
        try {
            // Search for resources related to course
            const keywords = this.extractKeywords();

            const results = await searchResources({
                query: keywords.join(" "),
                filters: {
                    difficulty: this.courseData.difficulty || null,
                },
            });

            this.resources = results.slice(0, this.options.relatedResourcesLimit);

            console.log(
                `[CourseIntegration] Loaded ${this.resources.length} related resources for course`
            );

            return this.resources;
        } catch (error) {
            console.error("[CourseIntegration] Error loading related resources:", error);
            return [];
        }
    }

    /**
     * Extract search keywords from course data
     * @private
     */
    extractKeywords() {
        const keywords = [];

        // Add course title words
        if (this.courseData.title) {
            keywords.push(...this.courseData.title.split(" ").slice(0, 3));
        }

        // Add course description keywords
        if (this.courseData.description) {
            const words = this.courseData.description.split(" ");
            const importantWords = words.filter(w => w.length > 4).slice(0, 2);
            keywords.push(...importantWords);
        }

        // Add academy/category
        if (this.courseData.academy) {
            keywords.push(this.courseData.academy);
        }

        // Add skills/tags
        if (this.courseData.skills) {
            keywords.push(...this.courseData.skills.slice(0, 2));
        }

        return [...new Set(keywords)].filter(k => k);
    }

    /**
     * Get resources by type distribution
     */
    getResourcesByType() {
        const byType = {};

        this.resources.forEach(resource => {
            const type = resource.type || "other";
            if (!byType[type]) {
                byType[type] = [];
            }
            byType[type].push(resource);
        });

        return byType;
    }

    /**
     * Create resources section HTML
     */
    createResourcesSection() {
        try {
            if (this.resources.length === 0) {
                return this.createEmptyState();
            }

            const section = document.createElement("section");
            section.className = "course-resources-section";
            section.innerHTML = `
                <div class="section-header">
                    <h2>📚 Learning Resources</h2>
                    <p>Recommended materials to supplement this course</p>
                </div>
            `;

            // Group by type if enabled
            if (this.options.showResourcesByType) {
                const byType = this.getResourcesByType();
                const types = Object.keys(byType).slice(0, this.options.maxTypes);

                types.forEach(type => {
                    const typeResources = byType[type];
                    const typeSection = this.createTypeSection(type, typeResources);
                    section.appendChild(typeSection);
                });
            } else {
                // Show all as single grid
                const grid = this.createResourceGrid(this.resources);
                section.appendChild(grid);
            }

            return section;
        } catch (error) {
            console.error("[CourseIntegration] Error creating resources section:", error);
            return this.createErrorState();
        }
    }

    /**
     * Create type-specific section
     * @private
     */
    createTypeSection(type, resources) {
        const typeIcons = {
            book: "📖",
            video: "🎥",
            paper: "📄",
            podcast: "🎙️",
            article: "📰",
        };

        const section = document.createElement("div");
        section.className = "resource-type-section";
        section.innerHTML = `
            <div class="type-header">
                <h3>${typeIcons[type] || "📚"} ${this.capitalize(type)}s</h3>
                <span class="badge">${resources.length}</span>
            </div>
        `;

        const grid = this.createResourceGrid(resources);
        section.appendChild(grid);

        return section;
    }

    /**
     * Create resource grid
     * @private
     */
    createResourceGrid(resources) {
        const grid = document.createElement("div");
        grid.className = "resource-grid";

        resources.forEach(resource => {
            const card = this.createResourceCard(resource);
            grid.appendChild(card);
        });

        return grid;
    }

    /**
     * Create individual resource card
     * @private
     */
    createResourceCard(resource) {
        const card = document.createElement("div");
        card.className = "resource-card";
        card.dataset.resourceId = resource.resourceId;

        card.innerHTML = `
            <div class="card-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <span class="type-badge">${this.getTypeEmoji(resource.type)}</span>
            </div>
            <div class="card-content">
                <h4>${this.truncate(resource.title, 50)}</h4>
                <div class="card-meta">
                    <span class="difficulty difficulty-${resource.difficulty}">
                        ${this.capitalize(resource.difficulty)}
                    </span>
                    <span class="rating">⭐ ${(resource.rating || 0).toFixed(1)}</span>
                </div>
                <div class="card-description">
                    ${this.truncate(resource.description, 80)}
                </div>
                <div class="card-footer">
                    <span class="time">⏱️ ${resource.estimatedTime || 2}h</span>
                    <div class="card-actions">
                        <button class="btn-icon save-btn" title="Save" data-resource-id="${resource.resourceId}">💾</button>
                        <button class="btn-icon like-btn" title="Like" data-resource-id="${resource.resourceId}">❤️</button>
                        <button class="btn-icon view-btn" title="View" data-resource-id="${resource.resourceId}">👁️</button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        card.querySelector(".save-btn").addEventListener("click", e => {
            this.handleSaveClick(e, resource);
        });

        card.querySelector(".like-btn").addEventListener("click", e => {
            this.handleLikeClick(e, resource);
        });

        card.querySelector(".view-btn").addEventListener("click", e => {
            this.handleViewClick(e, resource);
        });

        return card;
    }

    /**
     * Handle save button click
     * @private
     */
    async handleSaveClick(e, resource) {
        try {
            const button = e.currentTarget;
            const isSaved = button.classList.toggle("saved");

            // Call service
            await saveResource("current-student-id", resource.resourceId, isSaved);

            // Visual feedback
            button.style.opacity = "0.5";
            setTimeout(() => {
                button.style.opacity = "1";
            }, 300);

            console.log(`[CourseIntegration] Resource ${isSaved ? "saved" : "unsaved"}`);
        } catch (error) {
            console.error("[CourseIntegration] Error saving resource:", error);
        }
    }

    /**
     * Handle like button click
     * @private
     */
    async handleLikeClick(e, resource) {
        try {
            const button = e.currentTarget;
            const isLiked = button.classList.toggle("liked");

            await likeResource("current-student-id", resource.resourceId, isLiked);

            button.style.transform = "scale(1.3)";
            setTimeout(() => {
                button.style.transform = "scale(1)";
            }, 200);

            console.log(`[CourseIntegration] Resource ${isLiked ? "liked" : "unliked"}`);
        } catch (error) {
            console.error("[CourseIntegration] Error liking resource:", error);
        }
    }

    /**
     * Handle view button click
     * @private
     */
    handleViewClick(e, resource) {
        try {
            // Navigate to resource or open detail modal
            console.log(`[CourseIntegration] Viewing resource: ${resource.resourceId}`);

            // Example: navigate to Knowledge Hub
            window.location.href = `/knowledge-hub.html?resourceId=${resource.resourceId}`;
        } catch (error) {
            console.error("[CourseIntegration] Error viewing resource:", error);
        }
    }

    /**
     * Create empty state
     * @private
     */
    createEmptyState() {
        const div = document.createElement("div");
        div.className = "empty-state";
        div.innerHTML = `
            <div class="empty-icon">📚</div>
            <h3>No Resources Found</h3>
            <p>Browse the Knowledge Hub for more learning materials</p>
            <a href="/knowledge-hub.html" class="btn-primary">Browse Knowledge Hub</a>
        `;
        return div;
    }

    /**
     * Create error state
     * @private
     */
    createErrorState() {
        const div = document.createElement("div");
        div.className = "error-state";
        div.innerHTML = `
            <div class="error-icon">⚠️</div>
            <h3>Error Loading Resources</h3>
            <p>Unable to load related resources at this time</p>
        `;
        return div;
    }

    /**
     * Utility functions
     * @private
     */

    getTypeEmoji(type) {
        const emojis = {
            book: "📖",
            video: "🎥",
            paper: "📄",
            podcast: "🎙️",
            article: "📰",
        };
        return emojis[type] || "📚";
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    truncate(str, length) {
        if (!str) return "";
        return str.length > length ? str.substring(0, length) + "..." : str;
    }

    /**
     * Inject resources section into page
     */
    async injectIntoPage(selector) {
        try {
            const container = document.querySelector(selector);

            if (!container) {
                console.warn(`[CourseIntegration] Container not found: ${selector}`);
                return;
            }

            // Load resources
            await this.loadRelatedResources();

            // Create and append section
            const section = this.createResourcesSection();
            container.appendChild(section);

            console.log("[CourseIntegration] Resources injected into page");
        } catch (error) {
            console.error("[CourseIntegration] Error injecting resources:", error);
        }
    }
}

export { CourseIntegration };
export default CourseIntegration;
