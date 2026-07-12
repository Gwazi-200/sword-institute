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

class SearchBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.debounceTimer = null;
        this.debounceDelay = 300; // ms
        this.query = "";
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

        this.shadowRoot.innerHTML += `
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
                <div class="search-hint">Press Enter to search • Cmd/Ctrl+K to focus</div>
            </div>
        `;
    }

    attachEventListeners() {
        const input = this.shadowRoot.querySelector(".search-input");
        const clearBtn = this.shadowRoot.querySelector(".clear-btn");

        // Input event with debounce
        input.addEventListener("input", e => {
            this.query = e.target.value.trim();
            this.debounceSearch();
        });

        // Enter key
        input.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.doSearch();
            }
        });

        // Clear button
        clearBtn.addEventListener("click", () => {
            this.clear();
        });

        // Keyboard shortcut (Cmd/Ctrl + K)
        document.addEventListener("keydown", e => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                input.focus();
            }
        });
    }

    debounceSearch() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.doSearch();
        }, this.debounceDelay);
    }

    doSearch() {
        this.dispatchEvent(
            new CustomEvent("search", {
                detail: { query: this.query },
                bubbles: true,
            })
        );
    }

    clear() {
        this.query = "";
        const input = this.shadowRoot.querySelector(".search-input");
        input.value = "";
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
}

// Register custom element
customElements.define("search-bar", SearchBar);

export { SearchBar };
export default SearchBar;
