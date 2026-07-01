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
    const value = password || '';
    
    if (!value) {
        return { 
            valid: false, 
            message: 'Password is required.',
            score: 0,
            label: 'Weak',
            checks: {
                length: false,
                uppercase: false,
                lowercase: false,
                number: false,
                special: false
            }
        };
    }
    
    const checks = {
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[^A-Za-z0-9]/.test(value)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    
    let label = 'Weak';
    let valid = false;
    
    if (score >= 5) {
        label = 'Excellent';
        valid = true;
    } else if (score >= 4) {
        label = 'Strong';
        valid = true;
    } else if (score >= 3) {
        label = 'Good';
        valid = false;
    } else if (score >= 2) {
        label = 'Fair';
        valid = false;
    } else {
        label = 'Weak';
        valid = false;
    }
    
    const messages = [];
    if (!checks.length) messages.push('at least 8 characters');
    if (!checks.uppercase) messages.push('uppercase letter');
    if (!checks.lowercase) messages.push('lowercase letter');
    if (!checks.number) messages.push('number');
    if (!checks.special) messages.push('special character');
    
    const message = valid ? 'Password meets all requirements.' : `Password needs: ${messages.join(', ')}.`;
    
    return {
        valid,
        message,
        score,
        label,
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
    const value = password || '';
    
    if (!value) {
        return {
            score: 0,
            label: 'Enter a password',
            checks: {
                length: false,
                uppercase: false,
                lowercase: false,
                number: false,
                special: false
            }
        };
    }
    
    const checks = {
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[^A-Za-z0-9]/.test(value)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    
    const labels = {
        0: 'Weak',
        1: 'Weak',
        2: 'Fair',
        3: 'Good',
        4: 'Strong',
        5: 'Excellent'
    };
    
    return {
        score,
        label: labels[score] || 'Weak',
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