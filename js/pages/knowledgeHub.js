/**
 * ============================================================
 * Sword Institute LMS
 * Knowledge Hub Page Logic
 * Version: 1.0.0
 * ============================================================
 *
 * Main page controller for the Knowledge Hub discovery interface.
 *
 * Responsibilities:
 * - Orchestrate all 5 components (SearchBar, FilterPanel, Grid, Card, ContinueReading)
 * - Manage search and filter state
 * - Handle resource events
 * - Track user interactions
 * - Manage page state and UI feedback
 *
 * ============================================================
 */

import { loadResources, searchResources } from "../services/resourceService.js";
import { startReading, updateProgress } from "../services/readingProgressService.js";
import { getCacheStatus, clearCache } from "../services/resourceService.js";

/**
 * KnowledgeHubController
 *
 * Manages the Knowledge Hub discovery page state and interactions.
 */
class KnowledgeHubController {
    constructor(config = {}) {
        this.config = {
            studentId: config.studentId || "student_demo",
            debounceDelay: config.debounceDelay || 300,
            autoTrackReading: config.autoTrackReading !== false,
            analyticsEnabled: config.analyticsEnabled !== false,
            ...config,
        };

        this.state = {
            allResources: [],
            filteredResources: [],
            currentQuery: "",
            currentFilters: {},
            isLoading: false,
            cacheStats: {},
        };

        this.elements = {};
        this.debounceTimer = null;
    }

    /**
     * Initialize the controller and page
     */
    async init() {
        try {
            this.cacheElements();
            this.setupEventListeners();

            await this.loadInitialData();
            this.updateUI();

            console.log("[KnowledgeHub] Page initialized successfully");
        } catch (error) {
            console.error("[KnowledgeHub] Initialization error:", error);
            this.showError("Failed to initialize Knowledge Hub");
        }
    }

    /**
     * Cache DOM element references
     */
    cacheElements() {
        this.elements = {
            search: document.querySelector("search-bar"),
            filters: document.querySelector("filter-panel"),
            grid: document.querySelector("resource-grid"),
            loading: document.querySelector("#loading"),
            resultCount: document.querySelector("#result-count"),
            pageInfo: document.querySelector("#page-info"),
            resetBtn: document.querySelector("#reset-btn"),
            exportBtn: document.querySelector("#export-btn"),
        };

        // Validate required elements
        const requiredElements = ["search", "filters", "grid"];
        requiredElements.forEach(el => {
            if (!this.elements[el]) {
                throw new Error(`Missing required element: ${el}`);
            }
        });
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Search events
        this.elements.search.addEventListener("search", e => {
            this.handleSearch(e.detail.query);
        });

        // Filter events
        this.elements.filters.addEventListener("filters-changed", e => {
            this.handleFilterChange(e.detail.filters);
        });

        // Grid events
        this.elements.grid.addEventListener("resource-view", e => {
            this.handleResourceView(e.detail);
        });

        this.elements.grid.addEventListener("resource-saved", e => {
            this.handleResourceSaved(e.detail);
        });

        this.elements.grid.addEventListener("resource-liked", e => {
            this.handleResourceLiked(e.detail);
        });

        // Action buttons
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener("click", () => this.handleReset());
        }

        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener("click", () => this.handleExport());
        }

        // Keyboard shortcuts
        document.addEventListener("keydown", e => this.handleKeyboardShortcuts(e));
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            this.setLoading(true);

            // Load all resources
            this.state.allResources = await loadResources();
            this.state.filteredResources = [...this.state.allResources];

            // Get cache stats
            this.state.cacheStats = getCacheStatus();

            this.trackEvent("page_load", {
                resourceCount: this.state.allResources.length,
                cacheHit: this.state.cacheStats.hits,
            });
        } catch (error) {
            console.error("[KnowledgeHub] Error loading data:", error);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Handle search event
     */
    async handleSearch(query) {
        // Debounce search
        clearTimeout(this.debounceTimer);

        this.debounceTimer = setTimeout(async () => {
            try {
                this.setLoading(true);
                this.state.currentQuery = query;

                // Search with current filters
                const results = await searchResources({
                    query,
                    filters: this.state.currentFilters,
                });

                this.state.filteredResources = results;
                this.elements.grid.setResources(results);
                this.updateUI();

                this.trackEvent("search", {
                    query,
                    resultCount: results.length,
                });

                if (results.length === 0) {
                    this.showMessage(`No resources match "${query}"`, "info");
                }
            } catch (error) {
                console.error("[KnowledgeHub] Search error:", error);
                this.showError("Search failed");
            } finally {
                this.setLoading(false);
            }
        }, this.config.debounceDelay);
    }

    /**
     * Handle filter change event
     */
    async handleFilterChange(filters) {
        try {
            this.state.currentFilters = filters;

            // Re-search with new filters
            const results = await searchResources({
                query: this.state.currentQuery,
                filters,
            });

            this.state.filteredResources = results;
            this.elements.grid.setResources(results);
            this.updateUI();

            this.trackEvent("filter_change", {
                filters,
                resultCount: results.length,
            });
        } catch (error) {
            console.error("[KnowledgeHub] Filter error:", error);
            this.showError("Filter failed");
        }
    }

    /**
     * Handle resource view event
     */
    async handleResourceView({ resourceId, resource }) {
        try {
            if (this.config.autoTrackReading) {
                // Start reading session
                await startReading(this.config.studentId, resourceId);
            }

            this.showMessage(`Started reading: ${resource.title}`, "success");

            this.trackEvent("resource_view", {
                resourceId,
                title: resource.title,
                type: resource.type,
            });

            // Navigate to detail page (commented out for demo)
            // window.location.href = `/knowledge-hub/resource/${resourceId}`;
        } catch (error) {
            console.error("[KnowledgeHub] View error:", error);
        }
    }

    /**
     * Handle resource saved event
     */
    handleResourceSaved({ resourceId, isSaved }) {
        this.showMessage(
            isSaved ? "✓ Saved to your bookshelf" : "✗ Removed from bookshelf",
            "success"
        );

        this.trackEvent("resource_saved", {
            resourceId,
            isSaved,
        });
    }

    /**
     * Handle resource liked event
     */
    handleResourceLiked({ resourceId, isLiked }) {
        this.showMessage(
            isLiked ? "❤️ You liked this resource" : "👍 Like removed",
            "info"
        );

        this.trackEvent("resource_liked", {
            resourceId,
            isLiked,
        });
    }

    /**
     * Handle reset button click
     */
    handleReset() {
        this.elements.search.clear();
        this.elements.filters.clearFilters();
        this.state.currentQuery = "";
        this.state.currentFilters = {};

        this.elements.grid.setResources(this.state.allResources);
        this.updateUI();

        this.showMessage("Filters reset", "info");
        this.trackEvent("reset_filters", {});
    }

    /**
     * Handle export button click
     */
    async handleExport() {
        try {
            const csv = this.convertToCSV(this.state.filteredResources);
            this.downloadCSV(csv, "knowledge-hub-resources.csv");

            this.showMessage("Downloaded resource list", "success");

            this.trackEvent("export", {
                resourceCount: this.state.filteredResources.length,
            });
        } catch (error) {
            console.error("[KnowledgeHub] Export error:", error);
            this.showError("Export failed");
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Cmd/Ctrl + K -> Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            this.elements.search?.focus();
        }

        // Cmd/Ctrl + F -> Focus search (supercede browser find)
        if ((e.ctrlKey || e.metaKey) && e.key === "f") {
            e.preventDefault();
            this.elements.search?.focus();
        }

        // Escape -> Clear search
        if (e.key === "Escape") {
            if (this.elements.search?.getValue()) {
                this.elements.search?.clear();
            }
        }
    }

    /**
     * Update UI with current state
     */
    updateUI() {
        // Update result count
        if (this.elements.resultCount) {
            this.elements.resultCount.textContent = this.state.filteredResources.length;
        }

        // Update page info
        if (this.elements.pageInfo) {
            const info = this.elements.grid.getPageInfo?.();
            if (info) {
                this.elements.pageInfo.textContent =
                    `${info.currentPage} / ${info.totalPages}`;
            }
        }
    }

    /**
     * Set loading state
     */
    setLoading(isLoading) {
        this.state.isLoading = isLoading;

        if (this.elements.loading) {
            if (isLoading) {
                this.elements.loading.classList.add("active");
            } else {
                this.elements.loading.classList.remove("active");
            }
        }
    }

    /**
     * Show success/info message
     */
    showMessage(text, type = "info") {
        const template = document.querySelector("#status-template");
        if (!template) return;

        const message = template.content.cloneNode(true);
        const el = message.querySelector(".status-message");

        if (el) {
            el.classList.add(type);
            el.querySelector("#status-message-text").textContent = text;

            document.body.appendChild(message);

            // Auto-remove after 4 seconds
            setTimeout(() => {
                el?.remove();
            }, 4000);
        }
    }

    /**
     * Show error message
     */
    showError(text) {
        this.showMessage(text, "error");
    }

    /**
     * Convert resources to CSV format
     */
    convertToCSV(resources) {
        const headers = ["ID", "Title", "Type", "Difficulty", "Rating", "Academy", "Time"];
        const rows = resources.map(r => [
            r.resourceId,
            r.title,
            r.type,
            r.difficulty,
            r.rating,
            r.academy,
            r.estimatedTime,
        ]);

        const csv = [
            headers.join(","),
            ...rows.map(row =>
                row
                    .map(cell => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(",")
            ),
        ].join("\n");

        return csv;
    }

    /**
     * Download CSV file
     */
    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    /**
     * Track analytics events
     */
    trackEvent(eventName, eventData = {}) {
        if (!this.config.analyticsEnabled) return;

        // Send to analytics service (Firebase Analytics, Mixpanel, etc.)
        console.log(`[Analytics] ${eventName}:`, eventData);

        // Example: Firebase Analytics
        if (window.gtag) {
            window.gtag("event", eventName, eventData);
        }
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Clear cache and reload
     */
    async reload() {
        clearCache();
        await this.loadInitialData();
        this.elements.grid.setResources(this.state.allResources);
        this.updateUI();
    }
}

// Export for use
export { KnowledgeHubController };
export default KnowledgeHubController;
