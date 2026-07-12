/**
 * ============================================================
 * Sword Institute LMS
 * Dashboard Integration Module
 * Version: 1.0.0
 * ============================================================
 *
 * Integration module for adding Knowledge Hub widgets to dashboard.
 *
 * Provides:
 * - Continue Reading widget
 * - Personalized recommendations
 * - Trending resources
 * - Learning statistics
 *
 * ============================================================
 */

import { getContinueReading, getReadingStats } from "../services/readingProgressService.js";
import { getRecommendations } from "../services/recommendationService.js";
import { getCareerPortfolio } from "../services/careerPortfolioService.js";
import { getTrendingResourcesRecommendations } from "../services/recommendationService.js";

/**
 * Dashboard integration manager
 */
class DashboardIntegration {
    constructor(studentId, options = {}) {
        this.studentId = studentId;
        this.options = {
            showContinueReading: options.showContinueReading !== false,
            showRecommendations: options.showRecommendations !== false,
            showStats: options.showStats !== false,
            showTrending: options.showTrending !== false,
            continueReadingLimit: options.continueReadingLimit || 5,
            recommendationsLimit: options.recommendationsLimit || 6,
            trendingLimit: options.trendingLimit || 4,
        };
        this.widgets = [];
    }

    /**
     * Initialize and load all widgets
     */
    async init() {
        try {
            const widgets = [];

            if (this.options.showContinueReading) {
                widgets.push(this.createContinueReadingWidget());
            }

            if (this.options.showStats) {
                widgets.push(this.createStatsWidget());
            }

            if (this.options.showRecommendations) {
                widgets.push(this.createRecommendationsWidget());
            }

            if (this.options.showTrending) {
                widgets.push(this.createTrendingWidget());
            }

            this.widgets = await Promise.all(widgets);

            console.log(`[DashboardIntegration] Loaded ${this.widgets.length} widgets`);

            return this.widgets;
        } catch (error) {
            console.error("[DashboardIntegration] Error initializing widgets:", error);
            throw error;
        }
    }

    /**
     * Create Continue Reading widget
     * @private
     */
    createContinueReadingWidget() {
        return {
            id: "continue-reading",
            title: "📖 Continue Reading",
            component: "continue-reading",
            attributes: {
                "data-student-id": this.studentId,
                "data-limit": this.options.continueReadingLimit,
            },
            order: 1,
            size: "full", // full width
        };
    }

    /**
     * Create learning statistics widget
     * @private
     */
    async createStatsWidget() {
        try {
            const portfolio = await getCareerPortfolio(this.studentId);

            const stats = portfolio?.stats || {
                totalCompleted: 0,
                totalCertificates: 0,
                totalSkills: 0,
                totalLearningHours: 0,
                completionRate: 0,
            };

            return {
                id: "learning-stats",
                title: "📊 Learning Statistics",
                type: "stats",
                data: {
                    completed: stats.totalCompleted,
                    certificates: stats.totalCertificates,
                    skills: stats.totalSkills,
                    hours: Math.round(stats.totalLearningHours),
                    completionRate: stats.completionRate,
                },
                order: 2,
                size: "half",
            };
        } catch (error) {
            console.error("[DashboardIntegration] Error creating stats widget:", error);
            return null;
        }
    }

    /**
     * Create recommendations widget
     * @private
     */
    async createRecommendationsWidget() {
        try {
            const recs = await getRecommendations(
                this.studentId,
                this.options.recommendationsLimit
            );

            return {
                id: "recommendations",
                title: "✨ Recommended For You",
                type: "recommendations",
                data: recs,
                order: 3,
                size: "full",
            };
        } catch (error) {
            console.error("[DashboardIntegration] Error creating recommendations widget:", error);
            return null;
        }
    }

    /**
     * Create trending resources widget
     * @private
     */
    async createTrendingWidget() {
        try {
            const trending = await getTrendingResourcesRecommendations(
                this.options.trendingLimit
            );

            return {
                id: "trending",
                title: "🔥 Trending Now",
                type: "trending",
                data: trending,
                order: 4,
                size: "half",
            };
        } catch (error) {
            console.error("[DashboardIntegration] Error creating trending widget:", error);
            return null;
        }
    }

    /**
     * Render widget to DOM
     */
    renderWidget(widget, containerId) {
        try {
            const container = document.getElementById(containerId);

            if (!container) {
                console.warn(`[DashboardIntegration] Container not found: ${containerId}`);
                return;
            }

            // Create widget container
            const widgetEl = document.createElement("div");
            widgetEl.className = `dashboard-widget widget-${widget.size}`;
            widgetEl.id = widget.id;

            // Add header
            const header = document.createElement("div");
            header.className = "widget-header";
            header.textContent = widget.title;

            widgetEl.appendChild(header);

            // Render based on type
            if (widget.component) {
                // Custom component (e.g., continue-reading Web Component)
                const component = document.createElement(widget.component);
                Object.keys(widget.attributes || {}).forEach(key => {
                    component.setAttribute(key, widget.attributes[key]);
                });
                widgetEl.appendChild(component);
            } else if (widget.type === "stats") {
                // Stats cards
                const statsHtml = this.renderStats(widget.data);
                widgetEl.innerHTML += statsHtml;
            } else if (widget.type === "recommendations" || widget.type === "trending") {
                // Resource cards
                const cardsHtml = this.renderResourceCards(widget.data);
                widgetEl.innerHTML += cardsHtml;
            }

            container.appendChild(widgetEl);

            console.log(`[DashboardIntegration] Rendered widget: ${widget.id}`);
        } catch (error) {
            console.error("[DashboardIntegration] Error rendering widget:", error);
        }
    }

    /**
     * Render stats card HTML
     * @private
     */
    renderStats(stats) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.completed}</div>
                    <div class="stat-label">Resources Completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.hours}</div>
                    <div class="stat-label">Learning Hours</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.skills}</div>
                    <div class="stat-label">Skills Acquired</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.certificates}</div>
                    <div class="stat-label">Certificates</div>
                </div>
            </div>
        `;
    }

    /**
     * Render resource cards HTML
     * @private
     */
    renderResourceCards(resources) {
        return `
            <div class="resource-cards-grid">
                ${resources
                    .slice(0, 4)
                    .map(
                        resource =>
                            `
                    <div class="resource-card-minimal">
                        <div class="card-header">
                            <h4>${resource.title}</h4>
                            <span class="badge">${resource.type}</span>
                        </div>
                        <div class="card-meta">
                            <span>⭐ ${resource.rating || 0}</span>
                            <span>👁️ ${resource.views || 0}</span>
                        </div>
                        <button class="card-button" onclick="alert('${resource.resourceId}')">
                            View
                        </button>
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;
    }

    /**
     * Render all widgets to container
     */
    async renderAll(containerId) {
        try {
            const container = document.getElementById(containerId);

            if (!container) {
                throw new Error(`Container not found: ${containerId}`);
            }

            // Clear container
            container.innerHTML = "";

            // Create section for each widget
            for (const widget of this.widgets.filter(w => w)) {
                this.renderWidget(widget, containerId);
            }

            console.log("[DashboardIntegration] All widgets rendered");
        } catch (error) {
            console.error("[DashboardIntegration] Error rendering all widgets:", error);
        }
    }

    /**
     * Refresh widget data
     */
    async refresh(widgetId) {
        try {
            const widget = this.widgets.find(w => w?.id === widgetId);

            if (!widget) {
                console.warn(`[DashboardIntegration] Widget not found: ${widgetId}`);
                return;
            }

            console.log(`[DashboardIntegration] Refreshing widget: ${widgetId}`);

            // Re-fetch data based on widget type
            if (widgetId === "continue-reading") {
                const el = document.querySelector(`#${widgetId}`);
                if (el?.refresh) {
                    el.refresh();
                }
            }
        } catch (error) {
            console.error("[DashboardIntegration] Error refreshing widget:", error);
        }
    }
}

export { DashboardIntegration };
export default DashboardIntegration;
