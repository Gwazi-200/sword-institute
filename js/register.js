/**
 * ============================================================
 * register.js — Registration Page Controller
 * Sword Institute LMS
 * Version: 1.0.0
 * ============================================================
 * 
 * This file controls ONLY register.html.
 * Attaches ONE submit listener and orchestrates the flow.
 * 
 * ============================================================
 */

import { registerUser } from './auth.js';
import {
    validateName,
    validateEmail,
    validatePhone,
    validateCountry,
    validatePassword,
    validateConfirmPassword,
    validateTerms,
    calculatePasswordStrength
} from './validation.js';
import {
    showToast,
    clearToasts,
    showLoading,
    hideLoading,
    setFormDisabled,
    showError,
    clearErrors,
    updatePasswordMeter,
    togglePasswordVisibility
} from './ui.js';

// ============================================================
// DOM REFS
// ============================================================
// Support both legacy IDs (registration-form/fullName/terms/...) and current register.html IDs (registerForm/displayName/termsCheck/...).
const form = document.getElementById('registration-form') || document.getElementById('registerForm');
const fullName = document.getElementById('fullName') || document.getElementById('displayName');
const email = document.getElementById('email');
const phone = document.getElementById('phone') || { value: '', type: 'text' }; // optional
const country = document.getElementById('country') || { value: '', type: 'text' }; // optional
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const terms = document.getElementById('terms') || document.getElementById('termsCheck');
const submitBtn = document.getElementById('register-submit') || document.getElementById('registerBtn');
let isSubmitting = false;

if (!form || !submitBtn) {
    console.error('⚠️ Registration form or submit button is missing.');
}

// ============================================================
// FIELD MAPPING
// ============================================================
const fields = {
    fullName,
    email,
    phone,
    country,
    password,
    confirmPassword,
    terms
};

const fieldValidators = {
    fullName: validateName,
    email: validateEmail,
    phone: validatePhone,
    country: validateCountry,
    password: validatePassword,
    confirmPassword: (value, formData) => {
        const pw = document.getElementById('password')?.value || '';
        return validateConfirmPassword(value, pw);
    },
    terms: (value) => validateTerms(value)
};

// ============================================================
// REAL-TIME VALIDATION
// ============================================================

/**
 * Validate a single field and update UI
 */
function validateField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return true;
    
    let value;
    let validator;
    
    // Handle checkbox specially
    if (field.type === 'checkbox') {
        value = field.checked;
        validator = fieldValidators[fieldId];
    } else {
        value = field.value;
        validator = fieldValidators[fieldId];
    }
    
    if (!validator) return true;
    
    const result = validator(value);
    showError(fieldId, result.valid ? '' : result.message);
    return result.valid;
}

/**
 * Validate all fields
 */
function validateAll() {
    const fieldIds = [
        'fullName',
        'email',
        'phone',
        'country',
        'password',
        'confirmPassword',
        'terms'
    ];

    let allValid = true;

    fieldIds.forEach(id => {
        const valid = validateField(id);
        console.log(id, valid);

        if (!valid) {
            allValid = false;
        }
    });

    submitBtn.disabled = !allValid;

    console.log("Overall valid:", allValid);

    return allValid;
}

// ============================================================
// EVENT BINDING
// ============================================================

// Real-time validation on blur
['fullName', 'email', 'phone', 'country', 'password', 'confirmPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('blur', () => {
            validateField(id);
            validateAll();
        });
        
        el.addEventListener('input', () => {
            // Update password meter for password field
            if (id === 'password') {
                updatePasswordMeter(el.value);
            }
            // Re-validate confirm password when password changes
            if (id === 'password') {
                validateField('confirmPassword');
            }
            validateAll();
        });
    }
});

// Terms checkbox
if (terms) {
    terms.addEventListener('change', () => {
        validateField('terms');
        validateAll();
    });
}

// ============================================================
// PASSWORD TOGGLES
// ============================================================
const passwordToggle = document.getElementById('password-toggle');
const confirmToggle = document.getElementById('confirm-password-toggle');

if (passwordToggle) {
    passwordToggle.addEventListener('click', () => {
        togglePasswordVisibility('password', 'password-toggle', passwordToggle);
    });
    passwordToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePasswordVisibility('password', 'password-toggle', passwordToggle);
        }
    });
}

if (confirmToggle) {
    confirmToggle.addEventListener('click', () => {
        togglePasswordVisibility('confirmPassword', 'confirm-password-toggle', confirmToggle);
    });
    confirmToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePasswordVisibility('confirmPassword', 'confirm-password-toggle', confirmToggle);
        }
    });
}

// ============================================================
// FORM SUBMISSION
// ============================================================

/**
 * Handle form submission
 */
form.addEventListener('submit', async (e) => {
    console.log("🚀 Submit button clicked");
    
    e.preventDefault();
    
    // Clear old UI state
    clearToasts();
    clearErrors(form);
    
    // Final validation pass
    if (!validateAll()) {
        showToast('Please fix all errors before continuing.', 'warning');
        return;
    }
    
    // Prevent duplicate submissions
    if (isSubmitting) {
        return;
    }
    
    isSubmitting = true;
    
    // Collect form data
    const userData = {
        fullName: fullName.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        country: country.value,
        password: password.value
    };
    
    console.log('📝 Form validation passed. Submitting registration...');
    
    // Show loading state
    showLoading(submitBtn, 'Creating Account...');
    setFormDisabled(form, true);
    
    try {
        //// Register user with Firebase
        console.log("🚀 About to call registerUser");

        const result = await registerUser(userData, {
            sendVerification: true
        });

        console.log("✅ registerUser returned:", result);
        console.log('✅ Registration complete. User:', result.email);

        // Store session data for auth-aware pages
        sessionStorage.setItem('sword_user', JSON.stringify({
            uid: result.uid,
            email: result.email,
            fullName: result.fullName
        }));

        // Persist dashboard login state used by index.html
        localStorage.setItem('sword_student', JSON.stringify({
            uid: result.uid,
            email: result.email,
            name: result.fullName,
            phone: userData.phone,
            country: userData.country,
            goal: 'career',
            daily: 30,
            created: new Date().toISOString()
        }));
        
        // Show success toast
        showToast('🎉 Account created successfully! Redirecting to dashboard...', 'success', 3000);
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = './dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Registration error:', error);

        const friendlyMessage =
            error.code === 'auth/email-already-in-use' ? 'That email is already registered.' :
            error.code === 'auth/invalid-email' ? 'Please enter a valid email address.' :
            error.code === 'auth/weak-password' ? 'Password does not meet policy.' :
            error.message || 'Registration failed. Please try again.';

        showToast(friendlyMessage, 'error');
        
        // Reset form state
        hideLoading(submitBtn);
        setFormDisabled(form, false);
        submitBtn.disabled = false;
    } finally {
        isSubmitting = false;
    }
});

// ============================================================
// INITIAL STATE
// ============================================================

// Disable submit button initially
submitBtn.disabled = true;

// Initialize password meter
updatePasswordMeter('');

// Ensure initial validity state if browser autofills values
validateAll();

console.log('📋 Registration page loaded successfully.');
console.log('🔍 Validation ready. Submit button disabled until form is valid.');

// ============================================================
// EXPORTS (for debugging only)
// ============================================================
export default {
    validateField,
    validateAll,
    form,
    submitBtn
};