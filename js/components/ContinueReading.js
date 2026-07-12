/**
 * ============================================================
 * Sword Institute LMS
 * ContinueReading Component
 * Version: 1.0.0
 * ============================================================
 *
 * Dashboard widget showing recently accessed resources.
 *
 * Features:
 * - Shows 3-5 most recent resources
 * - Progress indicator
 * - Time spent display
 * - Quick-resume button
 * - Empty state handling
 *
 * Usage:
 * ```html
 * <continue-reading 
 *   data-student-id="student_123"
 *   data-limit="5">
 * </continue-reading>
 * ```
 *
 * ============================================================
 */

import { getContinueReading } from "../services/readingProgressService.js";

import { formatResourceTime, getTypeDisplayName } from "../utils/resourceNormalizer.js";

class ContinueReading extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.studentId = null;
        this.limit = 5;
        this.resources = [];
    }

    connectedCallback() {
        this.studentId = this.getAttribute("data-student-id");
        const limit = this.getAttribute("data-limit");

        if (limit) {
            this.limit = parseInt(limit);
        }

        if (!this.studentId) {
            console.error("ContinueReading: Missing data-student-id attribute");
            return;
        }

        this.setupStyles();
        this.loadResources();
    }

    setupStyles() {
        const style = document.createElement("style");
        style.textContent = `
            :host {
                --primary: #667eea;
                --success: #51cf66;
                --text: #333;
                --text-light: #666;
                --border: #e9ecef;
                --bg: #f8f9fa;
            }

            .widget {
                background: white;
                border-radius: 12px;
                border: 1px solid var(--border);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }

            .widget-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px;
                font-size: 16px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .widget-content {
                padding: 16px;
            }

            .resource-item {
                display: flex;
                gap: 12px;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 12px;
                background: var(--bg);
                transition: all 0.2s ease;
                cursor: pointer;
            }

            .resource-item:last-child {
                margin-bottom: 0;
            }

            .resource-item:hover {
                background: #f0f0f0;
                transform: translateX(4px);
            }

            .resource-thumbnail {
                width: 50px;
                height: 50px;
                border-radius: 6px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                background-size: cover;
                background-position: center;
                flex-shrink: 0;
            }

            .resource-info {
                flex: 1;
                min-width: 0;
            }

            .resource-title {
                font-size: 13px;
                font-weight: 600;
                color: var(--text);
                margin-bottom: 4px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .resource-meta {
                display: flex;
                gap: 12px;
                font-size: 11px;
                color: var(--text-light);
                margin-bottom: 6px;
            }

            .progress-bar {
                height: 4px;
                background: var(--border);
                border-radius: 2px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: var(--success);
                transition: width 0.3s ease;
            }

            .resource-badge {
                display: inline-block;
                font-size: 10px;
                background: var(--primary);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
            }

            .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: var(--text-light);
            }

            .empty-icon {
                font-size: 40px;
                margin-bottom: 12px;
            }

            .empty-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--text);
                margin-bottom: 4px;
            }

            .empty-text {
                font-size: 12px;
            }

            .loading {
                text-align: center;
                padding: 20px;
                color: var(--text-light);
                font-size: 12px;
            }

            .spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 2px solid var(--border);
                border-top-color: var(--primary);
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin-bottom: 8px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            @media (max-width: 600px) {
                .widget-header {
                    padding: 12px;
                    font-size: 14px;
                }

                .widget-content {
                    padding: 12px;
                }

                .resource-item {
                    padding: 10px;
                    margin-bottom: 10px;
                }

                .resource-thumbnail {
                    width: 40px;
                    height: 40px;
                }
            }
        `;
        this.shadowRoot.appendChild(style);
    }

    async loadResources() {
        try {
            this.renderLoading();

            this.resources = await getContinueReading(this.studentId, this.limit);

            if (this.resources.length === 0) {
                this.renderEmpty();
            } else {
                this.render();
            }
        } catch (error) {
            console.error("ContinueReading: Error loading resources:", error);
            this.renderError("Error loading resources");
        }
    }

    render() {
        let html = `
            <div class="widget">
                <div class="widget-header">
                    📖 Continue Reading
                </div>
                <div class="widget-content">
        `;

        this.resources.forEach(resource => {
            const {
                resourceId,
                title,
                progress,
                timeSpent,
                lastAccessedAt,
            } = resource;

            const timeDisplay = formatResourceTime(timeSpent);
            const lastAccessDate = new Date(lastAccessedAt.toDate());
            const daysAgo = Math.floor(
                (Date.now() - lastAccessDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const lastAccessText =
                daysAgo === 0
                    ? "Today"
                    : daysAgo === 1
                        ? "Yesterday"
                        : `${daysAgo} days ago`;

            html += `
                <div class="resource-item" data-resource-id="${resourceId}">
                    <div class="resource-thumbnail"></div>
                    <div class="resource-info">
                        <div class="resource-title">${title}</div>
                        <div class="resource-meta">
                            <span>⏱️ ${timeDisplay}</span>
                            <span>📅 ${lastAccessText}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="resource-badge">${progress}%</div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        this.shadowRoot.innerHTML = html;
        this.attachEventListeners();
    }

    renderEmpty() {
        const content = `
            <div class="widget">
                <div class="widget-header">
                    📖 Continue Reading
                </div>
                <div class="widget-content">
                    <div class="empty-state">
                        <div class="empty-icon">📚</div>
                        <div class="empty-title">No Reading History</div>
                        <div class="empty-text">Start reading to see your progress here</div>
                    </div>
                </div>
            </div>
        `;

        this.shadowRoot.innerHTML = content;
    }

    renderLoading() {
        const content = `
            <div class="widget">
                <div class="widget-header">
                    📖 Continue Reading
                </div>
                <div class="widget-content">
                    <div class="loading">
                        <div class="spinner"></div>
                        <div>Loading your reading list...</div>
                    </div>
                </div>
            </div>
        `;

        this.shadowRoot.innerHTML = content;
    }

    renderError(message) {
        const content = `
            <div class="widget">
                <div class="widget-header">
                    📖 Continue Reading
                </div>
                <div class="widget-content">
                    <div class="empty-state">
                        <div class="empty-title">❌ Error</div>
                        <div class="empty-text">${message}</div>
                    </div>
                </div>
            </div>
        `;

        this.shadowRoot.innerHTML = content;
    }

    attachEventListeners() {
        const items = this.shadowRoot.querySelectorAll(".resource-item");

        items.forEach(item => {
            item.addEventListener("click", () => {
                const resourceId = item.getAttribute("data-resource-id");
                const resource = this.resources.find(r => r.resourceId === resourceId);

                this.dispatchEvent(
                    new CustomEvent("resource-resume", {
                        detail: { resourceId, resource },
                        bubbles: true,
                    })
                );
            });
        });
    }

    refresh() {
        this.loadResources();
    }
}

// Register custom element
customElements.define("continue-reading", ContinueReading);

export { ContinueReading };
export default ContinueReading;
