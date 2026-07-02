/**
 * ============================================================
 * ui.js — UI Helper Functions
 * Sword Institute LMS
 * Version: 1.0.0
 * ============================================================
 * 
 * This file contains ONLY UI helper functions.
 * All DOM manipulation is centralized here.
 * 
 * ============================================================
 */
import { calculatePasswordStrength } from './validation.js';
// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

/**
 * Show a toast notification
 * 
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Display duration in ms
 * @returns {HTMLElement} The toast element
 */
export function showToast(message, type = 'error', duration = 5000) {
    const container = document.getElementById('toast-container');
    
    if (!container) {
        console.warn('⚠️ Toast container not found. Creating inline toast.');
        const wrapper = document.createElement('div');
        wrapper.id = 'toast-container';
        document.body.appendChild(wrapper);
        return showToast(message, type, duration);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    container.appendChild(toast);
    
    // Auto-dismiss after duration
    const timeoutId = setTimeout(() => {
        dismissToast(toast);
    }, duration);
    
    // Allow manual dismiss on click
    toast.addEventListener('click', () => {
        clearTimeout(timeoutId);
        dismissToast(toast);
    });
    
    // Allow keyboard dismiss
    toast.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
            clearTimeout(timeoutId);
            dismissToast(toast);
        }
    });
    
    toast.setAttribute('tabindex', '0');
    
    return toast;
}

/**
 * Dismiss a toast notification
 * 
 * @param {HTMLElement} toast - Toast element to dismiss
 */
function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 500);
}

/**
 * Clear all toast notifications
 */
export function clearToasts() {
    const container = document.getElementById('toast-container');
    if (container) {
        container.innerHTML = '';
    }
}

// ============================================================
// LOADING STATES
// ============================================================

/**
 * Show loading state on a button
 * 
 * @param {HTMLElement} button - Button element
 * @param {string} loadingText - Text to show during loading
 */
export function showLoading(button, loadingText = 'Processing...') {
    if (!button) return;
    
    const originalHtml = button.dataset.originalHtml || button.innerHTML;
    button.dataset.originalHtml = originalHtml;
    
    button.disabled = true;
    button.classList.add('loading');
    
    const spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    
    const textSpan = document.createElement('span');
    textSpan.className = 'btn-text';
    textSpan.textContent = loadingText;
    
    button.innerHTML = '';
    button.appendChild(spinner);
    button.appendChild(textSpan);
}

/**
 * Hide loading state on a button
 * 
 * @param {HTMLElement} button - Button element
 */
export function hideLoading(button) {
    if (!button) return;
    
    button.disabled = false;
    button.classList.remove('loading');
    
    const originalHtml = button.dataset.originalHtml || button.innerHTML || 'Submit';
    button.innerHTML = originalHtml;
    delete button.dataset.originalHtml;
}

/**
 * Disable form inputs
 * 
 * @param {HTMLFormElement} form - Form element
 * @param {boolean} disabled - Whether to disable
 */
export function setFormDisabled(form, disabled) {
    if (!form) return;
    
    const elements = form.querySelectorAll('input, select, button, textarea');
    elements.forEach(el => {
        if (el.type !== 'button' && el.type !== 'reset') {
            el.disabled = disabled;
        }
    });
}

// ============================================================
// ERROR DISPLAY
// ============================================================

/**
 * Show error message for a field
 * 
 * @param {string} fieldId - ID of the field
 * @param {string} message - Error message
 */
export function showError(fieldId, message) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
        errorEl.textContent = message || '';
        errorEl.style.display = message ? 'block' : 'none';
    }
    
    const input = document.getElementById(fieldId);
    if (input) {
        if (message) {
            input.classList.add('error');
            input.classList.remove('success');
            input.setAttribute('aria-invalid', 'true');
        } else {
            input.classList.remove('error');
            input.classList.add('success');
            input.setAttribute('aria-invalid', 'false');
        }
    }
}

/**
 * Clear all field errors
 * 
 * @param {HTMLFormElement} form - Form element
 */
export function clearErrors(form) {
    if (!form) return;
    
    const errorEls = form.querySelectorAll('.form-error');
    errorEls.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(el => {
        el.classList.remove('error', 'success');
        el.setAttribute('aria-invalid', 'false');
    });
}

// ============================================================
// PASSWORD STRENGTH UI
// ============================================================

/**
 * Update password strength meter
 * 
 * @param {string} password - Password value
 * @param {Object} config - Configuration
 * @param {HTMLElement} config.fillElement - Strength bar fill element
 * @param {HTMLElement} config.textElement - Strength text element
 * @param {NodeList} config.requirementItems - Requirement list items
 */
export function updatePasswordMeter(password, config = {}) {
    const {
        fillElement = document.getElementById('strength-fill'),
        textElement = document.getElementById('strength-text'),
        requirementItems = document.querySelectorAll('.req-item')
    } = config;
    
    if (!password) {
        if (fillElement) fillElement.style.width = '0%';
        if (textElement) {
            textElement.textContent = 'Enter a password';
            textElement.style.color = 'var(--text-secondary)';
        }
        if (requirementItems) {
            requirementItems.forEach(item => {
                const rule = item.dataset.rule;
                const text = item.textContent.replace(/^[✓✗]\s*/, '');
                const prefix = '✗';
                item.textContent = `${prefix} ${text}`;
                item.classList.remove('met', 'unmet');
            });
        }
        return;
    }
    
    const strength = calculatePasswordStrength(password);
    const percentage = (strength.score / 5) * 100;
    
    if (fillElement) {
        fillElement.style.width = `${percentage}%`;
        const colors = {
            0: '#DC2626',
            1: '#DC2626',
            2: '#F59E0B',
            3: '#F59E0B',
            4: '#16A34A',
            5: '#16A34A'
        };
        fillElement.style.backgroundColor = colors[strength.score] || '#DC2626';
    }
    
    if (textElement) {
        textElement.textContent = strength.label;
        const colors = {
            0: '#DC2626',
            1: '#DC2626',
            2: '#F59E0B',
            3: '#F59E0B',
            4: '#16A34A',
            5: '#16A34A'
        };
        textElement.style.color = colors[strength.score] || '#DC2626';
    }
    
    if (requirementItems) {
        const checks = strength.checks;
        const ruleMap = {
            length: 'length',
            uppercase: 'uppercase',
            lowercase: 'lowercase',
            number: 'number',
            special: 'special'
        };
        
        requirementItems.forEach(item => {
            const rule = item.dataset.rule;
            const isMet = checks[ruleMap[rule]] || false;
            const text = item.textContent.replace(/^[✓✗]\s*/, '');
            const prefix = isMet ? '✓' : '✗';
            item.textContent = `${prefix} ${text}`;
            item.classList.toggle('met', isMet);
            item.classList.toggle('unmet', !isMet);
        });
    }
}

// ============================================================
// PASSWORD VISIBILITY
// ============================================================

/**
 * Toggle password visibility
 * 
 * @param {string} inputId - ID of password input
 * @param {string} toggleId - ID of toggle button
 * @param {HTMLElement} toggleElement - Optional toggle element
 */
export function togglePasswordVisibility(inputId, toggleId, toggleElement) {
    const input = document.getElementById(inputId);
    const toggle = toggleElement || document.getElementById(toggleId);
    
    if (!input || !toggle) return;
    
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    
    const icon = toggle.querySelector('.eye-icon');
    if (icon) {
        icon.textContent = isPassword ? '🙈' : '👁️';
    }
}

// ============================================================
// CONSOLE BANNER
// ============================================================
console.log('🎨 UI module loaded successfully.');

// ============================================================
// EXPORTS
// ============================================================
export default {
    showToast,
    clearToasts,
    showLoading,
    hideLoading,
    setFormDisabled,
    showError,
    clearErrors,
    updatePasswordMeter,
    togglePasswordVisibility
};