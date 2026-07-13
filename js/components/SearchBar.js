/**
 * ============================================================
 * Sword Institute LMS
 * SearchBar Component
 * Version: 1.0.0
 * ============================================================
 *
 * Search input with type-ahead capabilities.
 *
 * Features:
 * - Real-time search query
 * - Clear button
 * - Enter key support
 * - Keyboard shortcuts
 * - Debounced search
 *
 * Usage:
 * ```html
 * <search-bar id="search" placeholder="Search resources...">
 * </search-bar>
 * ```
 *
 * ```javascript
 * const search = document.querySelector('search-bar');
 * search.addEventListener('search', (e) => {
 *   console.log('Search query:', e.detail.query);
 * });
 * ```
 *
 * ============================================================
 */

import { search, registerGlobalSearch } from '../services/searchService.js';
import { handleError } from '../services/errorService.js';

class SearchBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.debounceTimer = null;
        this.debounceDelay = 300; // ms
        this.query = "";
        this.results = [];
        this.cleanup = null;
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
                --border: #e9ecef;
                --hover: #f8f9fa;
            }

            .search-container {
                width: 100%;
                position: relative;
            }

            .search-wrapper {
                display: flex;
                align-items: center;
                background: white;
                border: 1px solid var(--border);
                border-radius: 10px;
                padding: 0 12px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }

            .search-wrapper:focus-within {
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .search-icon {
                font-size: 18px;
                opacity: 0.6;
                margin-right: 8px;
            }

            .search-input {
                flex: 1;
                border: none;
                background: transparent;
                padding: 10px 0;
                font-size: 14px;
                color: var(--text);
                outline: none;
            }

            .search-input::placeholder {
                color: #999;
            }

            .clear-btn {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 16px;
                padding: 4px;
                opacity: 0;
                transition: opacity 0.2s ease;
                margin-left: 8px;
            }

            .search-input:not(:placeholder-shown) ~ .clear-btn {
                opacity: 1;
            }

            .clear-btn:hover {
                transform: scale(1.2);
            }

            .search-hint {
                font-size: 11px;
                color: #999;
                margin-top: 6px;
                padding: 0 12px;
            }

            .search-results {
                position: absolute;
                top: calc(100% + 6px);
                left: 0;
                right: 0;
                background: white;
                border: 1px solid var(--border);
                border-radius: 10px;
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
                z-index: 1000;
                display: none;
            }

            .search-results.is-open {
                display: block;
            }

            .search-results ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .search-results li + li {
                border-top: 1px solid #f1f3f5;
            }

            .search-results a {
                display: block;
                padding: 10px 12px;
                color: inherit;
                text-decoration: none;
            }

            .search-results a:hover {
                background: var(--hover);
            }

            .search-results p {
                margin: 2px 0 0;
                font-size: 12px;
                color: #6c757d;
            }

            @media (max-width: 600px) {
                .search-input {
                    font-size: 16px;
                }
            }
        `;
        this.shadowRoot.appendChild(style);
    }

    render() {
        const placeholder = this.getAttribute("placeholder") || "Search resources...";
        const style = this.shadowRoot.querySelector("style");

        this.shadowRoot.innerHTML = "";
        if (style) {
            this.shadowRoot.appendChild(style);
        }

        this.shadowRoot.insertAdjacentHTML("beforeend", `
            <div class="search-container">
                <div class="search-wrapper">
                    <span class="search-icon">🔍</span>
                    <input 
                        type="text" 
                        class="search-input" 
                        placeholder="${placeholder}"
                        aria-label="Search resources"
                    />
                    <button class="clear-btn" title="Clear search" aria-label="Clear">✕</button>
                </div>
                <div class="search-results" role="listbox"></div>
                <div class="search-hint">Press Enter to search • Cmd/Ctrl+K to focus</div>
            </div>
        `);
    }

    attachEventListeners() {
        const input = this.shadowRoot.querySelector(".search-input");
        const clearBtn = this.shadowRoot.querySelector(".clear-btn");
        const resultPanel = this.shadowRoot.querySelector(".search-results");

        input.addEventListener("input", e => {
            this.query = e.target.value.trim();
            this.debounceSearch();
        });

        input.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.doSearch();
            }
        });

        clearBtn.addEventListener("click", () => {
            this.clear();
        });

        this.cleanup = registerGlobalSearch();
        document.addEventListener("keydown", e => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                input.focus();
            }
        });

        document.addEventListener("click", (event) => {
            if (!this.shadowRoot.contains(event.target)) {
                resultPanel.classList.remove("is-open");
            }
        });
    }

    debounceSearch() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.doSearch();
        }, this.debounceDelay);
    }

    async doSearch() {
        this.dispatchEvent(
            new CustomEvent("search", {
                detail: { query: this.query },
                bubbles: true,
            })
        );

        const resultPanel = this.shadowRoot.querySelector(".search-results");
        if (!this.query) {
            resultPanel.classList.remove("is-open");
            resultPanel.innerHTML = "";
            return;
        }

        try {
            this.results = await search(this.query, { limit: 6 });
            resultPanel.innerHTML = this.results.length
                ? `<ul>${this.results.map((item) => `<li><a href="${item.url}">${item.title}</a><p>${item.description}</p></li>`).join("")}</ul>`
                : '<p style="padding: 10px 12px; margin: 0;">No results found.</p>';
            resultPanel.classList.add("is-open");
        } catch (error) {
            handleError(error, 'search');
            resultPanel.innerHTML = '<p style="padding: 10px 12px; margin: 0;">Search is temporarily unavailable.</p>';
            resultPanel.classList.add("is-open");
        }
    }

    clear() {
        this.query = "";
        const input = this.shadowRoot.querySelector(".search-input");
        const resultPanel = this.shadowRoot.querySelector(".search-results");
        input.value = "";
        resultPanel.classList.remove("is-open");
        resultPanel.innerHTML = "";
        this.doSearch();
    }

    getValue() {
        return this.query;
    }

    setValue(value) {
        this.query = value;
        const input = this.shadowRoot.querySelector(".search-input");
        input.value = value;
    }

    focus() {
        this.shadowRoot.querySelector(".search-input").focus();
    }

    setDebounceDelay(delay) {
        this.debounceDelay = delay;
    }

    disconnectedCallback() {
        if (this.cleanup) {
            this.cleanup();
        }
        clearTimeout(this.debounceTimer);
    }
}

customElements.define("search-bar", SearchBar);

export { SearchBar };
export default SearchBar;
