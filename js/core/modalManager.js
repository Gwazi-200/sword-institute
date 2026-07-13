/**
 * ============================================================
 * Sword Institute LMS - Modal Manager Service
 * Version: 1.0.0
 * ============================================================
 *
 * Professional modal dialog management with:
 * - Centered vertical and horizontal positioning
 * - Backdrop blur and semi-transparent overlay
 * - Smooth open/close animations
 * - Keyboard navigation (Escape to close)
 * - Click-outside to close
 * - Background scroll locking
 * - Responsive mobile support
 * - Accessibility features
 *
 * ============================================================
 */

import { isDevelopment } from './environmentService.js';

/**
 * Modal configuration object
 * @typedef {Object} ModalConfig
 * @property {string} id - Unique modal identifier
 * @property {string} title - Modal title
 * @property {string} content - HTML content or template
 * @property {Object} buttons - Action buttons {label: callback}
 * @property {boolean} closeOnEscape - Allow Escape to close (default: true)
 * @property {boolean} closeOnBackdrop - Allow backdrop click to close (default: true)
 * @property {boolean} lockScroll - Lock background scrolling (default: true)
 * @property {string} size - Modal size: 'small', 'medium', 'large' (default: 'medium')
 * @property {Function} onOpen - Callback when modal opens
 * @property {Function} onClose - Callback when modal closes
 */

class ModalManager {
    constructor() {
        this.modals = new Map();
        this.activeModal = null;
        this.originalScrollY = 0;
    }

    /**
     * Create and register a modal
     * @param {ModalConfig} config - Modal configuration
     * @returns {Object} Modal controller with open/close methods
     */
    create(config) {
        const {
            id,
            title = 'Dialog',
            content = '',
            buttons = {},
            closeOnEscape = true,
            closeOnBackdrop = true,
            lockScroll = true,
            size = 'medium',
            onOpen = null,
            onClose = null,
        } = config;

        if (!id) {
            console.error('ModalManager: Modal must have an id');
            return null;
        }

        if (this.modals.has(id)) {
            console.warn(`ModalManager: Modal with id "${id}" already exists`);
            return this.modals.get(id);
        }

        // Create modal element
        const container = document.createElement('div');
        container.className = `sword-modal sword-modal--${size}`;
        container.setAttribute('role', 'dialog');
        container.setAttribute('aria-modal', 'true');
        container.setAttribute('aria-labelledby', `${id}-title`);
        container.hidden = true;

        container.innerHTML = `
            <div class="sword-modal__backdrop"></div>
            <div class="sword-modal__panel" role="document">
                <div class="sword-modal__header">
                    <h2 id="${id}-title" class="sword-modal__title">${escapeHtml(title)}</h2>
                    <button 
                        type="button" 
                        class="sword-modal__close" 
                        aria-label="Close ${title}"
                        data-action="modal-close"
                    >
                        <span aria-hidden="true">✕</span>
                    </button>
                </div>
                <div class="sword-modal__body">
                    ${content}
                </div>
                ${Object.keys(buttons).length > 0 ? `
                    <div class="sword-modal__footer">
                        ${Object.entries(buttons)
                            .map(([label, callback], index) => `
                                <button 
                                    type="button" 
                                    class="sword-modal__button ${index === 0 ? 'sword-modal__button--secondary' : 'sword-modal__button--primary'}"
                                    data-action="modal-button"
                                    data-button-index="${index}"
                                >
                                    ${escapeHtml(label)}
                                </button>
                            `)
                            .join('')}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(container);

        // Modal controller
        const controller = {
            id,
            config,
            element: container,
            buttons: Object.entries(buttons).map(([label, callback]) => ({ label, callback })),
            isOpen: false,

            open: () => {
                if (controller.isOpen) return;

                if (isDevelopment()) {
                    console.log(`[ModalManager] Opening modal: ${id}`);
                }

                // Close other modals
                if (this.activeModal && this.activeModal.id !== id) {
                    this.activeModal.close();
                }

                this.activeModal = controller;
                controller.isOpen = true;
                container.hidden = false;

                // Trigger reflow for animation
                container.offsetHeight;
                container.classList.add('is-open');

                // Lock scroll
                if (lockScroll) {
                    this.originalScrollY = window.scrollY || window.pageYOffset;
                    document.body.style.overflow = 'hidden';
                    document.body.style.paddingRight = this._getScrollbarWidth() + 'px';
                }

                // Attach event listeners
                this._attachEventListeners(controller, closeOnEscape, closeOnBackdrop);

                // Call callback
                if (onOpen) onOpen();
            },

            close: () => {
                if (!controller.isOpen) return;

                if (isDevelopment()) {
                    console.log(`[ModalManager] Closing modal: ${id}`);
                }

                controller.isOpen = false;
                container.classList.remove('is-open');

                // Wait for animation
                setTimeout(() => {
                    container.hidden = true;
                }, 300);

                // Restore scroll
                if (lockScroll) {
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                    window.scrollTo(0, this.originalScrollY);
                }

                // Detach event listeners
                this._detachEventListeners(controller);

                // Clear active modal
                if (this.activeModal?.id === id) {
                    this.activeModal = null;
                }

                // Call callback
                if (onClose) onClose();
            },

            toggle: () => {
                if (controller.isOpen) {
                    controller.close();
                } else {
                    controller.open();
                }
            },

            destroy: () => {
                controller.close();
                this.modals.delete(id);
                container.remove();
            },
        };

        this.modals.set(id, controller);
        return controller;
    }

    /**
     * Get modal by id
     * @param {string} id - Modal id
     * @returns {Object|null} Modal controller or null
     */
    get(id) {
        return this.modals.get(id) || null;
    }

    /**
     * Remove modal by id
     * @param {string} id - Modal id
     */
    remove(id) {
        const controller = this.modals.get(id);
        if (controller) {
            controller.destroy();
        }
    }

    /**
     * Close all modals
     */
    closeAll() {
        for (const [, controller] of this.modals) {
            if (controller.isOpen) {
                controller.close();
            }
        }
    }

    /**
     * Get scrollbar width
     * @private
     * @returns {number} Scrollbar width in pixels
     */
    _getScrollbarWidth() {
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll';
        document.body.appendChild(outer);

        const inner = document.createElement('div');
        outer.appendChild(inner);

        const width = outer.offsetWidth - inner.offsetWidth;
        outer.parentNode.removeChild(outer);

        return width;
    }

    /**
     * Attach event listeners to modal
     * @private
     */
    _attachEventListeners(controller, closeOnEscape, closeOnBackdrop) {
        const container = controller.element;

        // Close button
        const closeBtn = container.querySelector('[data-action="modal-close"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => controller.close());
        }

        // Backdrop click
        if (closeOnBackdrop) {
            const backdrop = container.querySelector('.sword-modal__backdrop');
            if (backdrop) {
                backdrop.addEventListener('click', () => controller.close());
            }
        }

        // Button clicks
        const buttons = container.querySelectorAll('[data-action="modal-button"]');
        buttons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const callback = controller.buttons[index]?.callback;
                if (callback) {
                    callback();
                }
            });
        });

        // Escape key
        if (closeOnEscape) {
            const handleEscape = (e) => {
                if (e.key === 'Escape' && controller.isOpen) {
                    controller.close();
                }
            };
            document.addEventListener('keydown', handleEscape);
            controller._escapeHandler = handleEscape;
        }
    }

    /**
     * Detach event listeners from modal
     * @private
     */
    _detachEventListeners(controller) {
        if (controller._escapeHandler) {
            document.removeEventListener('keydown', controller._escapeHandler);
            delete controller._escapeHandler;
        }
    }
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Create global singleton instance
const modalManager = new ModalManager();

export default modalManager;
export { ModalManager };
