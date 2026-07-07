/**
 * ============================================================
 * validation.js — Form Validation Service
 * Sword Institute LMS
 * Version: 1.0.0
 * ============================================================
 * 
 * This file contains ONLY validation logic.
 * Returns validation objects. Never manipulates HTML directly.
 * 
 * ============================================================
 */

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Validate full name
 * 
 * @param {string} name - Full name to validate
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateName(name) {
    const trimmed = name?.trim() || '';
    
    if (!trimmed) {
        return { valid: false, message: 'Full name is required.' };
    }
    
    if (trimmed.length < 2) {
        return { valid: false, message: 'Name must be at least 2 characters.' };
    }
    
    if (trimmed.length > 100) {
        return { valid: false, message: 'Name must be less than 100 characters.' };
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate email address
 * 
 * @param {string} email - Email to validate
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateEmail(email) {
    const trimmed = email?.trim() || '';
    
    if (!trimmed) {
        return { valid: false, message: 'Email address is required.' };
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
        return { valid: false, message: 'Please enter a valid email address.' };
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate phone number (international)
 * 
 * @param {string} phone - Phone number to validate
 * @returns {Object} { valid: boolean, message: string }
 */
export function validatePhone(phone) {
    const trimmed = phone?.trim() || '';
    
    if (!trimmed) {
        return { valid: false, message: 'Phone number is required.' };
    }
    
    // International phone format: +234, +1, 0712, etc.
    const phoneRegex = /^[\+\d\s\-\(\)]{8,20}$/;
    if (!phoneRegex.test(trimmed)) {
        return { valid: false, message: 'Please enter a valid phone number (8-20 digits).' };
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate country selection
 * 
 * @param {string} country - Country to validate
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateCountry(country) {
    const trimmed = country?.trim() || '';
    
    if (!trimmed) {
        return { valid: false, message: 'Please select your country.' };
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate password
 * 
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, message: string, score: number, label: string, checks: Object }
 */
export function validatePassword(password) {
    const policy = window.SwordPasswordPolicy;
    if (policy && typeof policy.validatePassword === 'function') {
        return policy.validatePassword(password);
    }

    const value = password || '';
    const checks = {
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value)
    };

    const score = Object.values(checks).filter(Boolean).length;
    const valid = score === 4;
    const message = valid ? 'Password meets policy.' : 'Password does not meet policy.';

    return {
        valid,
        message,
        score,
        label: score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong',
        checks
    };
}

/**
 * Validate confirm password
 * 
 * @param {string} confirmPassword - Confirm password value
 * @param {string} password - Original password value
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateConfirmPassword(confirmPassword, password) {
    const trimmed = confirmPassword?.trim() || '';
    const original = password || '';
    
    if (!trimmed) {
        return { valid: false, message: 'Please confirm your password.' };
    }
    
    if (trimmed !== original) {
        return { valid: false, message: 'Passwords do not match.' };
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate terms checkbox
 * 
 * @param {boolean} accepted - Whether terms are accepted
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateTerms(accepted) {
    if (!accepted) {
        return { valid: false, message: 'You must agree to the Terms of Service and Privacy Policy.' };
    }
    
    return { valid: true, message: '' };
}

/**
 * Calculate password strength score only
 * 
 * @param {string} password - Password to check
 * @returns {Object} { score: number, label: string, checks: Object }
 */
export function calculatePasswordStrength(password) {
    const policy = window.SwordPasswordPolicy;
    if (policy && typeof policy.calculatePasswordStrength === 'function') {
        return policy.calculatePasswordStrength(password);
    }

    const value = password || '';
    const checks = {
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value)
    };

    const score = Object.values(checks).filter(Boolean).length;

    return {
        score,
        label: score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong',
        checks
    };
}

// ============================================================
// EXPORTS
// ============================================================
export default {
    validateName,
    validateEmail,
    validatePhone,
    validateCountry,
    validatePassword,
    validateConfirmPassword,
    validateTerms,
    calculatePasswordStrength
};