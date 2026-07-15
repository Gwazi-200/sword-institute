const MODAL_ID = 'sword-profile-modal';
const MODAL_VISIBLE_CLASS = 'show';

class ModalController {
    constructor(options = {}) {
        this.id = options.id || MODAL_ID;
        this.visibleClass = options.visibleClass || MODAL_VISIBLE_CLASS;
        this.element = null;
        this.panel = null;
        this.titleElement = null;
        this.bodyElement = null;
        this.footerElement = null;
        this.bound = false;
        this.boundKeydown = false;
        this.isOpenState = false;

        this.initialize();
    }

    initialize() {
        if (typeof document === 'undefined') {
            return;
        }

        this.element = document.getElementById(this.id);
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.id = this.id;
            this.element.className = 'sword-profile-editor';
            this.element.setAttribute('role', 'dialog');
            this.element.setAttribute('aria-modal', 'true');
            this.element.setAttribute('aria-hidden', 'true');
            this.element.innerHTML = `
                <div class="sword-profile-editor__panel" data-modal-panel>
                    <div class="sword-profile-editor__header">
                        <div>
                            <h3 data-modal-title></h3>
                            <p>Keep your learning profile polished and current.</p>
                        </div>
                        <button type="button" class="sword-profile-editor__close" data-modal-close aria-label="Close profile editor">✕</button>
                    </div>
                    <div class="sword-profile-editor__body" data-modal-body></div>
                    <div class="sword-profile-editor__footer" data-modal-footer></div>
                </div>
            `;
            document.body.appendChild(this.element);
        }

        this.panel = this.element.querySelector('[data-modal-panel]');
        this.titleElement = this.element.querySelector('[data-modal-title]');
        this.bodyElement = this.element.querySelector('[data-modal-body]');
        this.footerElement = this.element.querySelector('[data-modal-footer]');
    }

    _bindEvents() {
        if (this.bound || !this.element) {
            return;
        }

        this.element.addEventListener('click', (event) => {
            if (event.target === this.element || event.target.closest('[data-modal-close]')) {
                event.preventDefault();
                this.close();
            }
        });

        this.bound = true;
    }

    _bindKeydown() {
        if (this.boundKeydown || typeof document === 'undefined') {
            return;
        }

        document.addEventListener('keydown', this.handleKeydown);
        this.boundKeydown = true;
    }

    _unbindKeydown() {
        if (!this.boundKeydown || typeof document === 'undefined') {
            return;
        }

        document.removeEventListener('keydown', this.handleKeydown);
        this.boundKeydown = false;
    }

    handleKeydown = (event) => {
        if (event.key === 'Escape' && this.isOpenState) {
            this.close();
        }
    };

    setContent({ title = '', bodyHtml = '', footerHtml = '' } = {}) {
        if (!this.element) {
            return this.element;
        }

        this._bindEvents();

        if (this.titleElement) {
            this.titleElement.textContent = title;
        }

        if (this.bodyElement) {
            this.bodyElement.innerHTML = bodyHtml;
        }

        if (this.footerElement) {
            this.footerElement.innerHTML = footerHtml;
        }

        return this.element;
    }

    open() {
        if (!this.element) {
            return;
        }

        this._bindEvents();
        this._bindKeydown();
        this.isOpenState = true;
        this.element.classList.add(this.visibleClass);
        this.element.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    }

    close() {
        if (!this.element) {
            return;
        }

        this.isOpenState = false;
        this._unbindKeydown();
        this.element.classList.remove(this.visibleClass);
        this.element.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    isOpen() {
        return this.isOpenState;
    }

    getElement() {
        return this.element;
    }
}

const globalController = typeof window !== 'undefined' && window.__swordProfileModalController
    ? window.__swordProfileModalController
    : (() => {
        if (typeof window !== 'undefined') {
            window.__swordProfileModalController = new ModalController();
            return window.__swordProfileModalController;
        }
        return new ModalController();
    })();

export function getProfileModalController() {
    return globalController;
}

export { ModalController };
export default getProfileModalController;
