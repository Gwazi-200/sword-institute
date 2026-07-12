/**
 * ============================================================
 * Sword Institute LMS
 * Lesson Player Integration Module
 * Version: 1.0.0
 * ============================================================
 *
 * Integration module for adding supplementary resources to lesson player.
 *
 * Provides:
 * - Related resources in lesson
 * - Downloadable materials
 * - Resource recommendations
 * - Reading list generation
 *
 * ============================================================
 */

import { getSimilarResources } from "../services/recommendationService.js";
import { searchResources } from "../services/resourceService.js";
import { getCollectionResources } from "../services/learningCollectionService.js";

/**
 * Lesson player integration manager
 */
class LessonPlayerIntegration {
    constructor(lessonData, options = {}) {
        this.lessonData = lessonData;
        this.lessonId = lessonData.id;
        this.courseId = lessonData.courseId;
        this.lessonTitle = lessonData.title || "Lesson";
        this.options = {
            showRelatedResources: options.showRelatedResources !== false,
            showSupplementary: options.showSupplementary !== false,
            showDownloads: options.showDownloads !== false,
            relatedLimit: options.relatedLimit || 4,
            supplementaryLimit: options.supplementaryLimit || 6,
        };
        this.resources = [];
    }

    /**
     * Load supplementary resources for lesson
     */
    async loadSupplementaryResources() {
        try {
            const keywords = this.extractLessonKeywords();

            const results = await searchResources({
                query: keywords.join(" "),
                limit: this.options.supplementaryLimit,
            });

            this.resources = results;

            console.log(
                `[LessonPlayerIntegration] Loaded ${this.resources.length} supplementary resources`
            );

            return this.resources;
        } catch (error) {
            console.error("[LessonPlayerIntegration] Error loading resources:", error);
            return [];
        }
    }

    /**
     * Extract keywords from lesson
     * @private
     */
    extractLessonKeywords() {
        const keywords = [];

        if (this.lessonData.title) {
            keywords.push(...this.lessonData.title.split(" ").slice(0, 3));
        }

        if (this.lessonData.description) {
            const words = this.lessonData.description.split(" ");
            const importantWords = words.filter(w => w.length > 4).slice(0, 2);
            keywords.push(...importantWords);
        }

        if (this.lessonData.topics) {
            keywords.push(...this.lessonData.topics.slice(0, 2));
        }

        return [...new Set(keywords)].filter(k => k);
    }

    /**
     * Create side panel with resources
     */
    createResourcePanel() {
        const panel = document.createElement("div");
        panel.className = "lesson-resources-panel";
        panel.innerHTML = `
            <div class="panel-header">
                <h3>📚 Supplementary Resources</h3>
                <button class="panel-close" aria-label="Close">✕</button>
            </div>
            <div class="panel-content"></div>
        `;

        const content = panel.querySelector(".panel-content");

        if (this.resources.length === 0) {
            content.innerHTML = "<p class='no-resources'>No supplementary resources available</p>";
        } else {
            this.resources.forEach((resource, index) => {
                const item = this.createResourceItem(resource, index);
                content.appendChild(item);
            });
        }

        // Close button
        panel.querySelector(".panel-close").addEventListener("click", () => {
            panel.remove();
        });

        return panel;
    }

    /**
     * Create resource item for panel
     * @private
     */
    createResourceItem(resource, index) {
        const item = document.createElement("div");
        item.className = "resource-item";
        item.innerHTML = `
            <div class="resource-number">${index + 1}</div>
            <div class="resource-info">
                <h4>${this.truncate(resource.title, 35)}</h4>
                <div class="resource-meta">
                    <span class="type">${this.getTypeEmoji(resource.type)}</span>
                    <span class="time">⏱️ ${resource.estimatedTime || 2}h</span>
                    <span class="rating">⭐ ${(resource.rating || 0).toFixed(1)}</span>
                </div>
            </div>
            <div class="resource-actions">
                <button class="action-btn download-btn" title="Download" data-resource-id="${resource.resourceId}">
                    ⬇️
                </button>
                <button class="action-btn open-btn" title="Open in Knowledge Hub" data-resource-id="${resource.resourceId}">
                    →
                </button>
            </div>
        `;

        // Event listeners
        item.querySelector(".download-btn").addEventListener("click", e => {
            this.handleDownload(e, resource);
        });

        item.querySelector(".open-btn").addEventListener("click", e => {
            this.handleOpen(e, resource);
        });

        return item;
    }

    /**
     * Create downloadable materials section
     */
    createDownloadsSection() {
        const section = document.createElement("div");
        section.className = "lesson-downloads";
        section.innerHTML = `
            <h3>📥 Course Materials</h3>
            <div class="downloads-list">
                <div class="download-item">
                    <span class="item-icon">📄</span>
                    <span class="item-name">Lesson Notes</span>
                    <button class="download-link">Download</button>
                </div>
                <div class="download-item">
                    <span class="item-icon">📊</span>
                    <span class="item-name">Slides</span>
                    <button class="download-link">Download</button>
                </div>
                <div class="download-item">
                    <span class="item-icon">💾</span>
                    <span class="item-name">Code Examples</span>
                    <button class="download-link">Download</button>
                </div>
            </div>
        `;

        return section;
    }

    /**
     * Create reading list
     */
    createReadingList() {
        const list = document.createElement("div");
        list.className = "lesson-reading-list";
        list.innerHTML = `
            <div class="list-header">
                <h3>📖 Reading List</h3>
                <button class="export-btn" title="Export as PDF">PDF</button>
            </div>
            <div class="list-content">
                ${this.resources
                    .map(
                        (resource, i) =>
                            `
                    <div class="list-item">
                        <span class="item-number">${i + 1}.</span>
                        <div class="item-details">
                            <p class="item-title">${resource.title}</p>
                            <p class="item-meta">
                                ${this.capitalize(resource.type)} • ${this.capitalize(resource.academy)} • 
                                Difficulty: ${this.capitalize(resource.difficulty)}
                            </p>
                        </div>
                        <a href="/knowledge-hub.html?resourceId=${resource.resourceId}" 
                           class="item-link" target="_blank">
                            View
                        </a>
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;

        return list;
    }

    /**
     * Create floating resources widget
     */
    createFloatingWidget() {
        const widget = document.createElement("div");
        widget.className = "floating-resources-widget";
        widget.innerHTML = `
            <button class="widget-toggle" title="Show resources">
                📚
                <span class="badge">${this.resources.length}</span>
            </button>
            <div class="widget-popup hidden">
                <div class="popup-header">
                    <h4>Lesson Resources</h4>
                    <button class="popup-close">✕</button>
                </div>
                <div class="popup-content">
                    ${this.resources
                        .slice(0, 5)
                        .map(
                            resource => `
                        <div class="popup-item">
                            <span>${this.truncate(resource.title, 25)}</span>
                            <a href="/knowledge-hub.html?resourceId=${resource.resourceId}" 
                               target="_blank">→</a>
                        </div>
                    `
                        )
                        .join("")}
                </div>
            </div>
        `;

        // Toggle popup
        widget.querySelector(".widget-toggle").addEventListener("click", () => {
            widget.querySelector(".widget-popup").classList.toggle("hidden");
        });

        // Close popup
        widget.querySelector(".popup-close").addEventListener("click", () => {
            widget.querySelector(".widget-popup").classList.add("hidden");
        });

        return widget;
    }

    /**
     * Handle download button
     * @private
     */
    async handleDownload(e, resource) {
        try {
            // Trigger download (implementation depends on resource storage)
            console.log(`[LessonPlayerIntegration] Downloading: ${resource.resourceId}`);

            // Example: download PDF or document
            const link = document.createElement("a");
            link.href = resource.contentUrl || `#/download/${resource.resourceId}`;
            link.download = `${resource.title}.pdf`;
            link.click();
        } catch (error) {
            console.error("[LessonPlayerIntegration] Error downloading resource:", error);
        }
    }

    /**
     * Handle open button
     * @private
     */
    handleOpen(e, resource) {
        try {
            // Open in Knowledge Hub
            window.open(
                `/knowledge-hub.html?resourceId=${resource.resourceId}`,
                "_blank"
            );
        } catch (error) {
            console.error("[LessonPlayerIntegration] Error opening resource:", error);
        }
    }

    /**
     * Inject resources into lesson player
     */
    async injectIntoLessonPlayer(playerSelector, panelSelector) {
        try {
            const player = document.querySelector(playerSelector);
            const panel = document.querySelector(panelSelector);

            if (!player || !panel) {
                console.warn("[LessonPlayerIntegration] Player or panel not found");
                return;
            }

            // Load resources
            await this.loadSupplementaryResources();

            if (this.resources.length === 0) {
                console.log("[LessonPlayerIntegration] No supplementary resources found");
                return;
            }

            // Create and inject resource panel
            const resourcePanel = this.createResourcePanel();
            panel.appendChild(resourcePanel);

            // Add downloads section to player
            const downloads = this.createDownloadsSection();
            player.appendChild(downloads);

            // Add floating widget
            const widget = this.createFloatingWidget();
            document.body.appendChild(widget);

            console.log("[LessonPlayerIntegration] Injected into lesson player");
        } catch (error) {
            console.error("[LessonPlayerIntegration] Error injecting into player:", error);
        }
    }

    /**
     * Create reading list PDF (for export)
     */
    async exportReadingListAsPDF() {
        try {
            // This would require a PDF library like jsPDF
            console.log("[LessonPlayerIntegration] Exporting reading list as PDF");

            const data = {
                title: `${this.lessonTitle} - Reading List`,
                date: new Date().toLocaleDateString(),
                resources: this.resources.map((r, i) => ({
                    number: i + 1,
                    title: r.title,
                    type: r.type,
                    academy: r.academy,
                    difficulty: r.difficulty,
                    url: `/knowledge-hub.html?resourceId=${r.resourceId}`,
                })),
            };

            return data;
        } catch (error) {
            console.error("[LessonPlayerIntegration] Error exporting reading list:", error);
            throw error;
        }
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
        return str?.charAt(0).toUpperCase() + str?.slice(1) || "";
    }

    truncate(str, length) {
        if (!str) return "";
        return str.length > length ? str.substring(0, length) + "..." : str;
    }
}

export { LessonPlayerIntegration };
export default LessonPlayerIntegration;
