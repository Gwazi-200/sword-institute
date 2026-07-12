/**
 * ============================================================
 * Sword Institute LMS
 * Academy Page Integration Module
 * Version: 1.0.0
 * ============================================================
 *
 * Integration module for adding featured resources to academy pages.
 *
 * Provides:
 * - Featured resources for academy
 * - Resource categories by type
 * - Popular resources in academy
 * - Trending resources in academy
 *
 * ============================================================
 */

import { searchResources } from "../services/resourceService.js";
import { getAcademyRecommendations } from "../services/recommendationService.js";
import { getPopularCollections } from "../services/learningCollectionService.js";
import { getPathsByDifficulty } from "../services/readingPathService.js";

/**
 * Academy page integration manager
 */
class AcademyIntegration {
    constructor(academyName, options = {}) {
        this.academyName = academyName;
        this.options = {
            showFeaturedResources: options.showFeaturedResources !== false,
            showResourcesByType: options.showResourcesByType !== false,
            showCollections: options.showCollections !== false,
            showLearningPaths: options.showLearningPaths !== false,
            featuredLimit: options.featuredLimit || 8,
            collectionsLimit: options.collectionsLimit || 4,
            pathsLimit: options.pathsLimit || 3,
        };
        this.data = {};
    }

    /**
     * Load all academy data
     */
    async loadAcademyData() {
        try {
            const data = {};

            if (this.options.showFeaturedResources) {
                data.featured = await this.loadFeaturedResources();
            }

            if (this.options.showCollections) {
                data.collections = await this.loadCollections();
            }

            if (this.options.showLearningPaths) {
                data.paths = await this.loadPaths();
            }

            this.data = data;

            console.log("[AcademyIntegration] Loaded academy data");

            return data;
        } catch (error) {
            console.error("[AcademyIntegration] Error loading academy data:", error);
            throw error;
        }
    }

    /**
     * Load featured resources for academy
     * @private
     */
    async loadFeaturedResources() {
        try {
            const results = await searchResources({
                query: "",
                filters: {
                    academy: this.academyName,
                },
                limit: this.options.featuredLimit,
            });

            // Sort by rating
            results.sort((a, b) => (b.rating || 0) - (a.rating || 0));

            return results;
        } catch (error) {
            console.error("[AcademyIntegration] Error loading featured resources:", error);
            return [];
        }
    }

    /**
     * Load collections for academy
     * @private
     */
    async loadCollections() {
        try {
            const collections = await getPopularCollections(this.options.collectionsLimit);

            // Filter by academy if needed
            return collections.filter(c => !c.academy || c.academy === this.academyName);
        } catch (error) {
            console.error("[AcademyIntegration] Error loading collections:", error);
            return [];
        }
    }

    /**
     * Load learning paths for academy
     * @private
     */
    async loadPaths() {
        try {
            const paths = await getPathsByDifficulty("beginner");
            return paths.slice(0, this.options.pathsLimit);
        } catch (error) {
            console.error("[AcademyIntegration] Error loading paths:", error);
            return [];
        }
    }

    /**
     * Create hero section
     */
    createHeroSection() {
        const hero = document.createElement("section");
        hero.className = "academy-hero";
        hero.innerHTML = `
            <div class="hero-background" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
            <div class="hero-content">
                <h1>${this.academyName}</h1>
                <p>Explore comprehensive learning resources in ${this.academyName}</p>
                <div class="hero-stats">
                    <div class="stat">
                        <span class="stat-value">${this.data.featured?.length || 0}</span>
                        <span class="stat-label">Resources</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${this.data.collections?.length || 0}</span>
                        <span class="stat-label">Collections</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${this.data.paths?.length || 0}</span>
                        <span class="stat-label">Learning Paths</span>
                    </div>
                </div>
            </div>
        `;
        return hero;
    }

    /**
     * Create featured resources section
     */
    createFeaturedSection() {
        if (!this.data.featured || this.data.featured.length === 0) {
            return null;
        }

        const section = document.createElement("section");
        section.className = "academy-featured";
        section.innerHTML = `
            <div class="section-header">
                <h2>⭐ Featured Resources</h2>
                <p>Curated top-rated materials in ${this.academyName}</p>
            </div>
        `;

        const grid = document.createElement("div");
        grid.className = "featured-grid";

        this.data.featured.slice(0, 8).forEach(resource => {
            const card = this.createFeaturedCard(resource);
            grid.appendChild(card);
        });

        section.appendChild(grid);
        return section;
    }

    /**
     * Create featured card
     * @private
     */
    createFeaturedCard(resource) {
        const card = document.createElement("div");
        card.className = "featured-card";
        card.innerHTML = `
            <div class="featured-header">
                <span class="type-badge">${this.getTypeEmoji(resource.type)}</span>
                <span class="rating">⭐ ${(resource.rating || 0).toFixed(1)}</span>
            </div>
            <div class="featured-content">
                <h3>${this.truncate(resource.title, 40)}</h3>
                <p class="featured-meta">${resource.type} • ${this.capitalize(resource.difficulty)}</p>
                <p class="featured-description">${this.truncate(resource.description, 60)}</p>
            </div>
            <div class="featured-footer">
                <span class="time">⏱️ ${resource.estimatedTime || 2}h</span>
                <a href="/knowledge-hub.html?resourceId=${resource.resourceId}" class="featured-link">
                    View →
                </a>
            </div>
        `;
        return card;
    }

    /**
     * Create collections section
     */
    createCollectionsSection() {
        if (!this.data.collections || this.data.collections.length === 0) {
            return null;
        }

        const section = document.createElement("section");
        section.className = "academy-collections";
        section.innerHTML = `
            <div class="section-header">
                <h2>📦 Learning Collections</h2>
                <p>Curated bundles of resources</p>
            </div>
        `;

        const grid = document.createElement("div");
        grid.className = "collections-grid";

        this.data.collections.forEach(collection => {
            const card = this.createCollectionCard(collection);
            grid.appendChild(card);
        });

        section.appendChild(grid);
        return section;
    }

    /**
     * Create collection card
     * @private
     */
    createCollectionCard(collection) {
        const card = document.createElement("div");
        card.className = "collection-card";
        card.innerHTML = `
            <div class="collection-icon">📚</div>
            <h3>${this.truncate(collection.title, 35)}</h3>
            <p class="collection-description">${this.truncate(collection.description, 50)}</p>
            <div class="collection-meta">
                <span>${collection.resources?.length || 0} resources</span>
                <span>${collection.enrollments || 0} enrolled</span>
            </div>
            <button class="btn-enroll" data-collection-id="${collection.id}">
                Enroll Now
            </button>
        `;

        card.querySelector(".btn-enroll").addEventListener("click", e => {
            this.handleEnrollCollection(e, collection);
        });

        return card;
    }

    /**
     * Create learning paths section
     */
    createPathsSection() {
        if (!this.data.paths || this.data.paths.length === 0) {
            return null;
        }

        const section = document.createElement("section");
        section.className = "academy-paths";
        section.innerHTML = `
            <div class="section-header">
                <h2>🛤️ Learning Paths</h2>
                <p>Structured learning journeys</p>
            </div>
        `;

        const grid = document.createElement("div");
        grid.className = "paths-grid";

        this.data.paths.forEach(path => {
            const card = this.createPathCard(path);
            grid.appendChild(card);
        });

        section.appendChild(grid);
        return section;
    }

    /**
     * Create path card
     * @private
     */
    createPathCard(path) {
        const card = document.createElement("div");
        card.className = "path-card";
        card.innerHTML = `
            <div class="path-header">
                <h3>${this.truncate(path.title, 30)}</h3>
                <span class="difficulty difficulty-${path.difficulty}">
                    ${this.capitalize(path.difficulty)}
                </span>
            </div>
            <p class="path-description">${this.truncate(path.description, 60)}</p>
            <div class="path-stats">
                <div class="path-stat">
                    <span class="stat-value">${path.resources?.length || 0}</span>
                    <span class="stat-label">Steps</span>
                </div>
                <div class="path-stat">
                    <span class="stat-value">${path.estimatedTime || 0}h</span>
                    <span class="stat-label">Time</span>
                </div>
                <div class="path-stat">
                    <span class="stat-value">${path.enrollments || 0}</span>
                    <span class="stat-label">Enrolled</span>
                </div>
            </div>
            <button class="btn-start" data-path-id="${path.id}">
                Start Learning
            </button>
        `;

        card.querySelector(".btn-start").addEventListener("click", e => {
            this.handleStartPath(e, path);
        });

        return card;
    }

    /**
     * Handle enroll collection
     * @private
     */
    async handleEnrollCollection(e, collection) {
        try {
            console.log(`[AcademyIntegration] Enrolling in collection: ${collection.id}`);
            // Implement enrollment logic
            alert(`Enrolled in collection: ${collection.title}`);
        } catch (error) {
            console.error("[AcademyIntegration] Error enrolling in collection:", error);
        }
    }

    /**
     * Handle start path
     * @private
     */
    async handleStartPath(e, path) {
        try {
            console.log(`[AcademyIntegration] Starting path: ${path.id}`);
            // Implement path enrollment logic
            alert(`Started path: ${path.title}`);
        } catch (error) {
            console.error("[AcademyIntegration] Error starting path:", error);
        }
    }

    /**
     * Create complete academy page
     */
    async createCompletePage() {
        try {
            await this.loadAcademyData();

            const page = document.createElement("div");
            page.className = "academy-page";

            // Add sections
            const hero = this.createHeroSection();
            page.appendChild(hero);

            const featured = this.createFeaturedSection();
            if (featured) page.appendChild(featured);

            const collections = this.createCollectionsSection();
            if (collections) page.appendChild(collections);

            const paths = this.createPathsSection();
            if (paths) page.appendChild(paths);

            return page;
        } catch (error) {
            console.error("[AcademyIntegration] Error creating page:", error);
            throw error;
        }
    }

    /**
     * Inject into existing page
     */
    async injectIntoPage(selector) {
        try {
            const container = document.querySelector(selector);

            if (!container) {
                console.warn(`[AcademyIntegration] Container not found: ${selector}`);
                return;
            }

            await this.loadAcademyData();

            // Append sections
            const featured = this.createFeaturedSection();
            if (featured) container.appendChild(featured);

            const collections = this.createCollectionsSection();
            if (collections) container.appendChild(collections);

            const paths = this.createPathsSection();
            if (paths) container.appendChild(paths);

            console.log("[AcademyIntegration] Injected into page");
        } catch (error) {
            console.error("[AcademyIntegration] Error injecting into page:", error);
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

export { AcademyIntegration };
export default AcademyIntegration;
