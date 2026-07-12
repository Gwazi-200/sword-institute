/**
 * ============================================================
 * Sword Institute LMS
 * ResourceGrid Component
 * Version: 1.0.0
 * ============================================================
 *
 * Displays a responsive grid of resource cards.
 *
 * Features:
 * - Responsive grid (1-4 columns based on screen)
 * - Pagination or infinite scroll support
 * - Loading state
 * - Empty state
 * - Customizable grid size
 *
 * Usage:
 * ```javascript
 * const grid = document.querySelector('resource-grid');
 * grid.setResources(resources);
 * grid.addEventListener('resource-view', (e) => {
 *   console.log('View resource:', e.detail.resourceId);
 * });
 * ```
 *
 * ============================================================
 */

class ResourceGrid extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.resources = [];
        this.studentId = null;
        this.pageSize = 12;
        this.currentPage = 0;
    }

    connectedCallback() {
        this.studentId = this.getAttribute("data-student-id");
        const pageSize = this.getAttribute("data-page-size");

        if (pageSize) {
            this.pageSize = parseInt(pageSize);
        }

        if (!this.studentId) {
            console.error("ResourceGrid: Missing data-student-id attribute");
        }

        this.setupStyles();
        this.render();
    }

    setupStyles() {
        const style = document.createElement("style");
        style.textContent = `
            :host {
                --primary: #667eea;
                --text: #333;
                --text-light: #666;
                --border: #e9ecef;
            }

            .grid-container {
                width: 100%;
            }

            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
            }

            .empty-state {
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
            }

            .empty-state-icon {
                font-size: 64px;
                margin-bottom: 16px;
            }

            .empty-state-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--text);
                margin-bottom: 8px;
            }

            .empty-state-text {
                font-size: 14px;
                color: var(--text-light);
            }

            .loading-state {
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                color: var(--text-light);
            }

            .spinner {
                display: inline-block;
                width: 30px;
                height: 30px;
                border: 3px solid var(--border);
                border-top-color: var(--primary);
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin-bottom: 16px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .pagination {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-top: 40px;
            }

            .pagination-btn {
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                background: white;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s ease;
            }

            .pagination-btn:hover:not(:disabled) {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .pagination-btn.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            .pagination-info {
                font-size: 12px;
                color: var(--text-light);
                margin: 0 16px;
            }

            @media (max-width: 768px) {
                .grid {
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px;
                }
            }

            @media (max-width: 480px) {
                .grid {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
            }
        `;
        this.shadowRoot.appendChild(style);
    }

    setResources(resources) {
        this.resources = resources || [];
        this.currentPage = 0;
        this.render();
    }

    addResources(resources) {
        this.resources = [...this.resources, ...(resources || [])];
        this.render();
    }

    clearResources() {
        this.resources = [];
        this.currentPage = 0;
        this.render();
    }

    render() {
        const container = this.shadowRoot.querySelector(".grid-container") ||
            this.createContainer();

        if (this.resources.length === 0) {
            this.renderEmpty(container);
            return;
        }

        this.renderGrid(container);
    }

    createContainer() {
        const container = document.createElement("div");
        container.className = "grid-container";
        this.shadowRoot.appendChild(container);
        return container;
    }

    renderEmpty(container) {
        container.innerHTML = `
            <div class="grid">
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <h3 class="empty-state-title">No Resources Found</h3>
                    <p class="empty-state-text">Try adjusting your search or filters to find more resources.</p>
                </div>
            </div>
        `;
    }

    renderGrid(container) {
        const startIdx = this.currentPage * this.pageSize;
        const endIdx = startIdx + this.pageSize;
        const pageResources = this.resources.slice(startIdx, endIdx);
        const totalPages = Math.ceil(this.resources.length / this.pageSize);

        let html = '<div class="grid">';

        pageResources.forEach(resource => {
            html += `<resource-card 
                data-resource-id="${resource.resourceId}" 
                data-student-id="${this.studentId}">
            </resource-card>`;
        });

        html += '</div>';

        // Add pagination if multiple pages
        if (totalPages > 1) {
            html += this.renderPagination(totalPages);
        }

        container.innerHTML = html;

        // Attach event listeners to cards
        this.attachCardListeners(container);
    }

    renderPagination(totalPages) {
        let html = '<div class="pagination">';

        // Previous button
        html += `<button class="pagination-btn" ${this.currentPage === 0 ? 'disabled' : ''} 
            id="prev-btn">← Previous</button>`;

        // Page numbers
        html += `<span class="pagination-info">Page ${this.currentPage + 1} of ${totalPages}</span>`;

        // Next button
        html += `<button class="pagination-btn" ${this.currentPage === totalPages - 1 ? 'disabled' : ''} 
            id="next-btn">Next →</button>`;

        html += '</div>';

        return html;
    }

    attachCardListeners(container) {
        // Wait for cards to be defined
        setTimeout(() => {
            const cards = container.querySelectorAll("resource-card");
            cards.forEach(card => {
                card.addEventListener("resource-view", e => {
                    this.dispatchEvent(
                        new CustomEvent("resource-view", {
                            detail: e.detail,
                            bubbles: true,
                        })
                    );
                });

                card.addEventListener("resource-saved", e => {
                    this.dispatchEvent(
                        new CustomEvent("resource-saved", {
                            detail: e.detail,
                            bubbles: true,
                        })
                    );
                });

                card.addEventListener("resource-liked", e => {
                    this.dispatchEvent(
                        new CustomEvent("resource-liked", {
                            detail: e.detail,
                            bubbles: true,
                        })
                    );
                });
            });

            // Attach pagination listeners
            const prevBtn = container.querySelector("#prev-btn");
            const nextBtn = container.querySelector("#next-btn");

            if (prevBtn) {
                prevBtn.addEventListener("click", () => this.goToPreviousPage());
            }

            if (nextBtn) {
                nextBtn.addEventListener("click", () => this.goToNextPage());
            }
        }, 0);
    }

    goToPreviousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.render();
            this.scrollToTop();
        }
    }

    goToNextPage() {
        const totalPages = Math.ceil(this.resources.length / this.pageSize);
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.render();
            this.scrollToTop();
        }
    }

    scrollToTop() {
        this.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setPageSize(size) {
        this.pageSize = size;
        this.currentPage = 0;
        this.render();
    }

    getPageInfo() {
        const totalPages = Math.ceil(this.resources.length / this.pageSize);
        return {
            currentPage: this.currentPage + 1,
            totalPages,
            pageSize: this.pageSize,
            totalResources: this.resources.length,
        };
    }
}

// Register custom element
customElements.define("resource-grid", ResourceGrid);

export { ResourceGrid };
export default ResourceGrid;
