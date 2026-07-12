/**
 * ============================================================
 * Sword Institute LMS
 * FilterPanel Component
 * Version: 1.0.0
 * ============================================================
 *
 * Multi-dimensional filter controls for resources.
 *
 * Features:
 * - Academy dropdown
 * - Type checkboxes
 * - Difficulty radio buttons
 * - Rating slider
 * - Tags multi-select
 * - Clear filters button
 *
 * Usage:
 * ```html
 * <filter-panel id="filters"></filter-panel>
 * ```
 *
 * ```javascript
 * const filters = document.querySelector('filter-panel');
 * filters.addEventListener('filters-changed', (e) => {
 *   console.log('Active filters:', e.detail.filters);
 * });
 * ```
 *
 * ============================================================
 */

import { 
    getTypeLabels,
    getDifficultyLabels,
    getTypeDisplayName
} from "../utils/searchHelpers.js";

class FilterPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.filters = {
            academy: null,
            types: [],
            difficulty: null,
            minRating: 0,
            tags: [],
        };
        this.allTags = [];
        this.academies = [
            "AI Masters",
            "Data Science Hub",
            "Business Academy",
            "Leadership Institute",
        ];
    }

    connectedCallback() {
        this.setupStyles();
        this.render();
        this.attachEventListeners();
    }

    setupStyles() {
        const style = document.createElement("style");
        style.textContent = `
            :host {
                --primary: #667eea;
                --text: #333;
                --text-light: #666;
                --border: #e9ecef;
                --bg: #f8f9fa;
            }

            .filter-panel {
                background: white;
                border-radius: 10px;
                border: 1px solid var(--border);
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }

            .filter-group {
                margin-bottom: 24px;
            }

            .filter-group:last-child {
                margin-bottom: 0;
            }

            .filter-title {
                font-size: 13px;
                font-weight: 700;
                color: var(--text);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .filter-title .emoji {
                font-size: 16px;
                margin-right: 6px;
            }

            /* Academy Dropdown */
            .academy-select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                background: white;
                font-size: 13px;
                color: var(--text);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .academy-select:hover {
                border-color: var(--primary);
            }

            .academy-select:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            /* Type Checkboxes */
            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .checkbox-item {
                display: flex;
                align-items: center;
                cursor: pointer;
            }

            .checkbox-item input[type="checkbox"] {
                width: 16px;
                height: 16px;
                cursor: pointer;
                margin-right: 8px;
                accent-color: var(--primary);
            }

            .checkbox-label {
                font-size: 13px;
                color: var(--text-light);
                cursor: pointer;
            }

            .checkbox-label:hover {
                color: var(--text);
            }

            /* Difficulty Radio */
            .radio-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .radio-item {
                display: flex;
                align-items: center;
                cursor: pointer;
            }

            .radio-item input[type="radio"] {
                width: 16px;
                height: 16px;
                cursor: pointer;
                margin-right: 8px;
                accent-color: var(--primary);
            }

            .radio-label {
                font-size: 13px;
                color: var(--text-light);
                cursor: pointer;
                text-transform: capitalize;
            }

            .radio-label:hover {
                color: var(--text);
            }

            /* Rating Slider */
            .rating-slider {
                width: 100%;
                cursor: pointer;
                accent-color: var(--primary);
            }

            .rating-display {
                font-size: 13px;
                color: var(--text-light);
                margin-top: 8px;
                text-align: center;
            }

            /* Tags */
            .tags-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .tag-btn {
                padding: 6px 12px;
                border: 1px solid var(--border);
                border-radius: 20px;
                background: white;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--text-light);
            }

            .tag-btn:hover {
                border-color: var(--primary);
                color: var(--primary);
            }

            .tag-btn.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            /* Action Buttons */
            .filter-actions {
                display: flex;
                gap: 10px;
                padding-top: 16px;
                border-top: 1px solid var(--border);
            }

            .btn {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--border);
                border-radius: 6px;
                background: white;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .btn:hover {
                background: var(--bg);
            }

            .btn-clear {
                border-color: #ff6b6b;
                color: #ff6b6b;
            }

            .btn-clear:hover {
                background: rgba(255, 107, 107, 0.1);
            }

            .btn-apply {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            .btn-apply:hover {
                opacity: 0.9;
            }

            @media (max-width: 600px) {
                .filter-panel {
                    padding: 16px;
                }

                .checkbox-group,
                .radio-group {
                    gap: 8px;
                }
            }
        `;
        this.shadowRoot.appendChild(style);
    }

    render() {
        const types = getTypeLabels();
        const difficulties = getDifficultyLabels();

        let typesHtml = '<div class="checkbox-group">';
        Object.entries(types).forEach(([key, label]) => {
            typesHtml += `
                <label class="checkbox-item">
                    <input type="checkbox" class="type-checkbox" value="${key}">
                    <span class="checkbox-label">${label}</span>
                </label>
            `;
        });
        typesHtml += '</div>';

        let difficultiesHtml = '<div class="radio-group">';
        Object.entries(difficulties).forEach(([key, label]) => {
            difficultiesHtml += `
                <label class="radio-item">
                    <input type="radio" class="difficulty-radio" name="difficulty" value="${key}">
                    <span class="radio-label">${label}</span>
                </label>
            `;
        });
        difficultiesHtml += '</div>';

        this.shadowRoot.innerHTML += `
            <div class="filter-panel">
                <div class="filter-group">
                    <div class="filter-title">
                        <span><span class="emoji">🏫</span>Academy</span>
                    </div>
                    <select class="academy-select" id="academy-select">
                        <option value="">All Academies</option>
                        ${this.academies.map(a => `<option value="${a}">${a}</option>`).join("")}
                    </select>
                </div>

                <div class="filter-group">
                    <div class="filter-title">
                        <span><span class="emoji">📚</span>Resource Type</span>
                    </div>
                    ${typesHtml}
                </div>

                <div class="filter-group">
                    <div class="filter-title">
                        <span><span class="emoji">📈</span>Difficulty</span>
                    </div>
                    ${difficultiesHtml}
                </div>

                <div class="filter-group">
                    <div class="filter-title">
                        <span><span class="emoji">⭐</span>Minimum Rating</span>
                    </div>
                    <input type="range" class="rating-slider" id="rating-slider" min="0" max="5" step="0.5" value="0">
                    <div class="rating-display">All ratings (<span id="rating-value">0</span>+)</div>
                </div>

                <div class="filter-actions">
                    <button class="btn btn-clear" id="clear-btn">Clear Filters</button>
                    <button class="btn btn-apply" id="apply-btn">Apply</button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const academySelect = this.shadowRoot.querySelector("#academy-select");
        const typeCheckboxes = this.shadowRoot.querySelectorAll(".type-checkbox");
        const difficultyRadios = this.shadowRoot.querySelectorAll(".difficulty-radio");
        const ratingSlider = this.shadowRoot.querySelector("#rating-slider");
        const ratingValue = this.shadowRoot.querySelector("#rating-value");
        const clearBtn = this.shadowRoot.querySelector("#clear-btn");
        const applyBtn = this.shadowRoot.querySelector("#apply-btn");

        // Academy
        academySelect.addEventListener("change", e => {
            this.filters.academy = e.target.value || null;
            this.emitFilterChange();
        });

        // Type checkboxes
        typeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", e => {
                if (e.target.checked) {
                    this.filters.types.push(e.target.value);
                } else {
                    this.filters.types = this.filters.types.filter(t => t !== e.target.value);
                }
                this.emitFilterChange();
            });
        });

        // Difficulty radios
        difficultyRadios.forEach(radio => {
            radio.addEventListener("change", e => {
                this.filters.difficulty = e.target.checked ? e.target.value : null;
                this.emitFilterChange();
            });
        });

        // Rating slider
        ratingSlider.addEventListener("input", e => {
            this.filters.minRating = parseFloat(e.target.value);
            ratingValue.textContent = this.filters.minRating;
            this.emitFilterChange();
        });

        // Clear button
        clearBtn.addEventListener("click", () => {
            this.clearFilters();
        });

        // Apply button
        applyBtn.addEventListener("click", () => {
            this.applyFilters();
        });
    }

    emitFilterChange() {
        this.dispatchEvent(
            new CustomEvent("filters-changed", {
                detail: { filters: this.getActiveFilters() },
                bubbles: true,
            })
        );
    }

    getActiveFilters() {
        return {
            academy: this.filters.academy,
            types: this.filters.types.length > 0 ? this.filters.types : null,
            difficulty: this.filters.difficulty,
            minRating: this.filters.minRating > 0 ? this.filters.minRating : 0,
        };
    }

    clearFilters() {
        this.filters = {
            academy: null,
            types: [],
            difficulty: null,
            minRating: 0,
            tags: [],
        };

        // Reset UI
        this.shadowRoot.querySelector("#academy-select").value = "";
        this.shadowRoot.querySelectorAll(".type-checkbox").forEach(cb => (cb.checked = false));
        this.shadowRoot.querySelectorAll(".difficulty-radio").forEach(rb => (rb.checked = false));
        this.shadowRoot.querySelector("#rating-slider").value = "0";
        this.shadowRoot.querySelector("#rating-value").textContent = "0";

        this.emitFilterChange();
    }

    applyFilters() {
        this.dispatchEvent(
            new CustomEvent("filters-applied", {
                detail: { filters: this.getActiveFilters() },
                bubbles: true,
            })
        );
    }

    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
        // Update UI to match filters
        // (Implementation would sync UI with filters object)
    }
}

// Register custom element
customElements.define("filter-panel", FilterPanel);

export { FilterPanel };
export default FilterPanel;
