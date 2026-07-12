/**
 * ============================================================
 * Sword Institute LMS
 * ResourceCard Component
 * Version: 1.0.0
 * ============================================================
 *
 * Displays a single resource with metadata and actions.
 *
 * Features:
 * - Resource thumbnail and metadata
 * - Type and difficulty badges
 * - Rating display
 * - Save/Like actions
 * - Click to view details
 *
 * Usage:
 * ```html
 * <resource-card 
 *   data-resource-id="res_001"
 *   data-student-id="student_123">
 * </resource-card>
 * ```
 *
 * ============================================================
 */

import {
    getResourceById,
} from "../services/resourceService.js";

import {
    isSaved,
    isLiked,
    toggleSave,
    toggleLike,
} from "../services/bookmarkService.js";

import {
    formatResourceTime,
    getThumbnailURL,
    getTypeDisplayName,
    getDifficultyBadgeColor,
} from "../utils/resourceNormalizer.js";

class ResourceCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.resource = null;
        this.studentId = null;
        this.isSaved = false;
        this.isLiked = false;
    }

    connectedCallback() {
        this.studentId = this.getAttribute("data-student-id");
        const resourceId = this.getAttribute("data-resource-id");

        if (!resourceId || !this.studentId) {
            console.error("ResourceCard: Missing resourceId or studentId");
            return;
        }

        this.loadResource(resourceId);
    }

    async loadResource(resourceId) {
        try {
            this.resource = await getResourceById(resourceId);

            if (!this.resource) {
                console.error(`ResourceCard: Resource ${resourceId} not found`);
                this.renderError("Resource not found");
                return;
            }

            // Load bookmark status
            this.isSaved = await isSaved(this.studentId, resourceId);
            this.isLiked = await isLiked(this.studentId, resourceId);

            this.render();
            this.attachEventListeners();
        } catch (error) {
            console.error("ResourceCard: Error loading resource:", error);
            this.renderError("Error loading resource");
        }
    }

    render() {
        if (!this.resource) return;

        const {
            title,
            type,
            difficulty,
            rating,
            ratingCount,
            estimatedTime,
            author,
            academy,
        } = this.resource;

        const thumbnail = getThumbnailURL(this.resource);
        const typeLabel = getTypeDisplayName(type);
        const difficultyColor = getDifficultyBadgeColor(difficulty);
        const timeDisplay = formatResourceTime(estimatedTime);

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --primary: #667eea;
                    --danger: #ff6b6b;
                    --success: #51cf66;
                    --warning: #ffd93d;
                    --text: #333;
                    --text-light: #666;
                    --bg-light: #f8f9fa;
                    --border: #e9ecef;
                }

                .card {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    border: 1px solid var(--border);
                }

                .card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                }

                .card-thumbnail {
                    width: 100%;
                    height: 160px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    background-size: cover;
                    background-position: center;
                    position: relative;
                    overflow: hidden;
                }

                .card-thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .card-badge-container {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    display: flex;
                    gap: 6px;
                }

                .badge {
                    background: rgba(255, 255, 255, 0.95);
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    backdrop-filter: blur(10px);
                }

                .badge-type {
                    color: var(--primary);
                }

                .badge-difficulty {
                    color: white;
                    background: ${difficultyColor};
                }

                .card-content {
                    padding: 16px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .card-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text);
                    margin: 0 0 6px 0;
                    line-height: 1.4;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }

                .card-author {
                    font-size: 12px;
                    color: var(--text-light);
                    margin-bottom: 8px;
                }

                .card-meta {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-bottom: 12px;
                    font-size: 11px;
                    color: var(--text-light);
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .rating {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: auto;
                    padding-top: 8px;
                    border-top: 1px solid var(--border);
                }

                .star {
                    color: #ffd93d;
                }

                .rating-text {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text);
                }

                .rating-count {
                    font-size: 11px;
                    color: var(--text-light);
                }

                .card-actions {
                    display: flex;
                    gap: 6px;
                    padding-top: 12px;
                    border-top: 1px solid var(--border);
                    margin-top: auto;
                }

                .action-btn {
                    flex: 1;
                    background: var(--bg-light);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    padding: 6px 8px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                }

                .action-btn:hover {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .action-btn.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .error {
                    padding: 16px;
                    text-align: center;
                    color: var(--text-light);
                    font-size: 12px;
                }

                .loading {
                    padding: 16px;
                    text-align: center;
                    color: var(--text-light);
                    font-size: 12px;
                }

                @media (max-width: 600px) {
                    .card-content {
                        padding: 12px;
                    }

                    .card-title {
                        font-size: 13px;
                    }
                }
            </style>

            <div class="card">
                <div class="card-thumbnail" style="background-image: url('${thumbnail}');">
                    <div class="card-badge-container">
                        <span class="badge badge-type">${typeLabel}</span>
                        <span class="badge badge-difficulty">${difficulty}</span>
                    </div>
                </div>

                <div class="card-content">
                    <h3 class="card-title">${title}</h3>
                    <p class="card-author">by ${author}</p>

                    <div class="card-meta">
                        <div class="meta-item">
                            <span>📚</span>
                            <span>${academy}</span>
                        </div>
                        <div class="meta-item">
                            <span>⏱️</span>
                            <span>${timeDisplay}</span>
                        </div>
                    </div>

                    <div class="rating">
                        <span class="star">★</span>
                        <span class="rating-text">${rating.toFixed(1)}</span>
                        <span class="rating-count">(${ratingCount})</span>
                    </div>
                </div>

                <div class="card-actions">
                    <button class="action-btn save-btn ${this.isSaved ? "active" : ""}" title="Save">
                        <span>${this.isSaved ? "💾" : "💿"}</span>
                        <span>Save</span>
                    </button>
                    <button class="action-btn like-btn ${this.isLiked ? "active" : ""}" title="Like">
                        <span>${this.isLiked ? "❤️" : "🤍"}</span>
                        <span>Like</span>
                    </button>
                    <button class="action-btn view-btn" title="View">
                        <span>👁️</span>
                        <span>View</span>
                    </button>
                </div>
            </div>
        `;
    }

    renderError(message) {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --text-light: #666;
                }
                .error {
                    padding: 16px;
                    text-align: center;
                    color: var(--text-light);
                    font-size: 12px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
            </style>
            <div class="error">${message}</div>
        `;
    }

    attachEventListeners() {
        const saveBtn = this.shadowRoot.querySelector(".save-btn");
        const likeBtn = this.shadowRoot.querySelector(".like-btn");
        const viewBtn = this.shadowRoot.querySelector(".view-btn");

        if (saveBtn) {
            saveBtn.addEventListener("click", e => {
                e.stopPropagation();
                this.handleSave();
            });
        }

        if (likeBtn) {
            likeBtn.addEventListener("click", e => {
                e.stopPropagation();
                this.handleLike();
            });
        }

        if (viewBtn) {
            viewBtn.addEventListener("click", e => {
                e.stopPropagation();
                this.handleView();
            });
        }

        const card = this.shadowRoot.querySelector(".card");
        if (card) {
            card.addEventListener("click", () => this.handleView());
        }
    }

    async handleSave() {
        try {
            this.isSaved = await toggleSave(this.studentId, this.resource.resourceId);
            this.render();
            this.attachEventListeners();
            this.dispatchEvent(
                new CustomEvent("resource-saved", {
                    detail: { resourceId: this.resource.resourceId, isSaved: this.isSaved },
                })
            );
        } catch (error) {
            console.error("Error saving resource:", error);
        }
    }

    async handleLike() {
        try {
            this.isLiked = await toggleLike(this.studentId, this.resource.resourceId);
            this.render();
            this.attachEventListeners();
            this.dispatchEvent(
                new CustomEvent("resource-liked", {
                    detail: { resourceId: this.resource.resourceId, isLiked: this.isLiked },
                })
            );
        } catch (error) {
            console.error("Error liking resource:", error);
        }
    }

    handleView() {
        this.dispatchEvent(
            new CustomEvent("resource-view", {
                detail: { resourceId: this.resource.resourceId, resource: this.resource },
            })
        );
    }
}

// Register custom element
customElements.define("resource-card", ResourceCard);

export { ResourceCard };
export default ResourceCard;
