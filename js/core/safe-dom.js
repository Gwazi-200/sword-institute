/**
 * ============================================================
 * Sword Institute LMS
 * Safe DOM Access Module
 * Version: 1.0.0
 * ============================================================
 *
 * Provides safe, error-tolerant DOM manipulation helpers.
 * Prevents "Cannot read properties of null" errors.
 *
 * All DOM access goes through these utilities.
 * ============================================================
 */

/**
 * Safely query a single element
 * @param {string} selector - CSS selector
 * @param {Element} [context=document] - Search context
 * @returns {Element|null} Element or null if not found
 */
export function safeQuery(selector, context = document) {
    if (!selector || typeof selector !== 'string') return null;
    if (!context) return null;
    try {
        return context.querySelector(selector);
    } catch (error) {
        console.warn(`Safe query failed for "${selector}":`, error.message);
        return null;
    }
}

/**
 * Safely query all elements
 * @param {string} selector - CSS selector
 * @param {Element} [context=document] - Search context
 * @returns {Element[]} Array of elements (empty if none found)
 */
export function safeQueryAll(selector, context = document) {
    if (!selector || typeof selector !== 'string') return [];
    if (!context) return [];
    try {
        return Array.from(context.querySelectorAll(selector));
    } catch (error) {
        console.warn(`Safe queryAll failed for "${selector}":`, error.message);
        return [];
    }
}

/**
 * Safely get element by ID
 * @param {string} id - Element ID
 * @returns {Element|null} Element or null if not found
 */
export function safeGetById(id) {
    if (!id || typeof id !== 'string') return null;
    try {
        return document.getElementById(id);
    } catch (error) {
        console.warn(`Safe getElementById failed for "${id}":`, error.message);
        return null;
    }
}

/**
 * Safely set element style property
 * @param {Element|null} element - Target element
 * @param {string} property - CSS property name
 * @param {string} value - CSS property value
 * @returns {boolean} True if set successfully
 */
export function safeSetStyle(element, property, value) {
    if (!element || !property) return false;
    try {
        element.style[property] = value;
        return true;
    } catch (error) {
        console.warn(`Safe setStyle failed:`, error.message);
        return false;
    }
}

/**
 * Safely get element style property
 * @param {Element|null} element - Target element
 * @param {string} property - CSS property name
 * @returns {string} Style value or empty string
 */
export function safeGetStyle(element, property) {
    if (!element || !property) return '';
    try {
        return window.getComputedStyle(element).getPropertyValue(property);
    } catch (error) {
        console.warn(`Safe getStyle failed:`, error.message);
        return '';
    }
}

/**
 * Safely set element innerHTML
 * @param {Element|null} element - Target element
 * @param {string} html - HTML string
 * @returns {boolean} True if set successfully
 */
export function safeSetHTML(element, html) {
    if (!element) return false;
    try {
        element.innerHTML = String(html || '');
        return true;
    } catch (error) {
        console.warn(`Safe setHTML failed:`, error.message);
        return false;
    }
}

/**
 * Safely set element textContent
 * @param {Element|null} element - Target element
 * @param {string} text - Text content
 * @returns {boolean} True if set successfully
 */
export function safeSetText(element, text) {
    if (!element) return false;
    try {
        element.textContent = String(text || '');
        return true;
    } catch (error) {
        console.warn(`Safe setText failed:`, error.message);
        return false;
    }
}

/**
 * Safely get element text content
 * @param {Element|null} element - Target element
 * @returns {string} Text content or empty string
 */
export function safeGetText(element) {
    if (!element) return '';
    try {
        return element.textContent || '';
    } catch (error) {
        console.warn(`Safe getText failed:`, error.message);
        return '';
    }
}

/**
 * Safely add CSS class
 * @param {Element|null} element - Target element
 * @param {string} className - Class name
 * @returns {boolean} True if added successfully
 */
export function safeAddClass(element, className) {
    if (!element || !className) return false;
    try {
        element.classList.add(className);
        return true;
    } catch (error) {
        console.warn(`Safe addClass failed:`, error.message);
        return false;
    }
}

/**
 * Safely remove CSS class
 * @param {Element|null} element - Target element
 * @param {string} className - Class name
 * @returns {boolean} True if removed successfully
 */
export function safeRemoveClass(element, className) {
    if (!element || !className) return false;
    try {
        element.classList.remove(className);
        return true;
    } catch (error) {
        console.warn(`Safe removeClass failed:`, error.message);
        return false;
    }
}

/**
 * Safely toggle CSS class
 * @param {Element|null} element - Target element
 * @param {string} className - Class name
 * @returns {boolean} Current toggle state
 */
export function safeToggleClass(element, className) {
    if (!element || !className) return false;
    try {
        return element.classList.toggle(className);
    } catch (error) {
        console.warn(`Safe toggleClass failed:`, error.message);
        return false;
    }
}

/**
 * Safely check if element has class
 * @param {Element|null} element - Target element
 * @param {string} className - Class name
 * @returns {boolean} True if element has class
 */
export function safeHasClass(element, className) {
    if (!element || !className) return false;
    try {
        return element.classList.contains(className);
    } catch (error) {
        console.warn(`Safe hasClass failed:`, error.message);
        return false;
    }
}

/**
 * Safely add event listener
 * @param {Element|null} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} [options] - Listener options
 * @returns {boolean} True if listener added successfully
 */
export function safeAddListener(element, event, handler, options = {}) {
    if (!element || !event || typeof handler !== 'function') return false;
    try {
        element.addEventListener(event, handler, options);
        return true;
    } catch (error) {
        console.warn(`Safe addEventListener failed:`, error.message);
        return false;
    }
}

/**
 * Safely remove event listener
 * @param {Element|null} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} [options] - Listener options
 * @returns {boolean} True if listener removed successfully
 */
export function safeRemoveListener(element, event, handler, options = {}) {
    if (!element || !event || typeof handler !== 'function') return false;
    try {
        element.removeEventListener(event, handler, options);
        return true;
    } catch (error) {
        console.warn(`Safe removeEventListener failed:`, error.message);
        return false;
    }
}

/**
 * Safely set element attribute
 * @param {Element|null} element - Target element
 * @param {string} name - Attribute name
 * @param {string} value - Attribute value
 * @returns {boolean} True if set successfully
 */
export function safeSetAttr(element, name, value) {
    if (!element || !name) return false;
    try {
        element.setAttribute(name, String(value || ''));
        return true;
    } catch (error) {
        console.warn(`Safe setAttribute failed:`, error.message);
        return false;
    }
}

/**
 * Safely get element attribute
 * @param {Element|null} element - Target element
 * @param {string} name - Attribute name
 * @returns {string|null} Attribute value or null
 */
export function safeGetAttr(element, name) {
    if (!element || !name) return null;
    try {
        return element.getAttribute(name);
    } catch (error) {
        console.warn(`Safe getAttribute failed:`, error.message);
        return null;
    }
}

/**
 * Safely remove element attribute
 * @param {Element|null} element - Target element
 * @param {string} name - Attribute name
 * @returns {boolean} True if removed successfully
 */
export function safeRemoveAttr(element, name) {
    if (!element || !name) return false;
    try {
        element.removeAttribute(name);
        return true;
    } catch (error) {
        console.warn(`Safe removeAttribute failed:`, error.message);
        return false;
    }
}

/**
 * Wait for DOMContentLoaded event
 * @returns {Promise<void>} Resolves when DOM is ready
 */
export function onDOMReady() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        } else {
            resolve();
        }
    });
}

/**
 * Check if element exists in DOM
 * @param {Element|null} element - Target element
 * @returns {boolean} True if element exists
 */
export function safeExists(element) {
    if (!element) return false;
    try {
        return document.contains(element);
    } catch {
        return false;
    }
}

/**
 * Safely append element to parent
 * @param {Element|null} parent - Parent element
 * @param {Element|null} child - Child element
 * @returns {boolean} True if appended successfully
 */
export function safeAppend(parent, child) {
    if (!parent || !child) return false;
    try {
        parent.appendChild(child);
        return true;
    } catch (error) {
        console.warn(`Safe appendChild failed:`, error.message);
        return false;
    }
}

/**
 * Safely remove element from DOM
 * @param {Element|null} element - Element to remove
 * @returns {boolean} True if removed successfully
 */
export function safeRemove(element) {
    if (!element) return false;
    try {
        element.remove();
        return true;
    } catch (error) {
        console.warn(`Safe remove failed:`, error.message);
        return false;
    }
}
