/**
 * ============================================================
 * Sword Institute LMS - Environment Service
 * Version: 1.0.0
 * ============================================================
 *
 * Safe environment detection and configuration management.
 * Handles undefined or missing environment objects gracefully.
 *
 * Use this service instead of direct checks like:
 * - typeof firebase
 * - 'production' in import.meta.env
 * - window.config?.value
 *
 * ============================================================
 */

/**
 * Safely detect if running in production mode
 * @returns {boolean} True if production, false for development
 */
export function isProduction() {
    // Check import.meta.env (Vite)
    if (import.meta?.env?.production !== undefined) {
        return import.meta.env.production === true;
    }

    // Check process.env (Node/webpack)
    if (typeof process !== 'undefined' && process?.env?.NODE_ENV) {
        return process.env.NODE_ENV === 'production';
    }

    // Check window config
    if (typeof window !== 'undefined' && window.APP_CONFIG?.environment) {
        return window.APP_CONFIG.environment === 'production';
    }

    // Default to development
    return false;
}

/**
 * Safely detect development mode
 * @returns {boolean} True if development, false for production
 */
export function isDevelopment() {
    return !isProduction();
}

/**
 * Safely get environment variable
 * @param {string} key - Environment variable key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Environment value or default
 */
export function getEnv(key, defaultValue = undefined) {
    // Try import.meta.env first (Vite)
    if (import.meta?.env?.[key] !== undefined) {
        return import.meta.env[key];
    }

    // Try process.env (Node/webpack)
    if (typeof process !== 'undefined' && process?.env?.[key] !== undefined) {
        return process.env[key];
    }

    // Try window config
    if (typeof window !== 'undefined' && window.APP_CONFIG?.[key] !== undefined) {
        return window.APP_CONFIG[key];
    }

    // Return default
    return defaultValue;
}

/**
 * Check if a global object/variable exists
 * @param {string} name - Global variable name
 * @returns {boolean} True if exists and is truthy
 */
export function hasGlobal(name) {
    if (typeof window === 'undefined') return false;
    return Boolean(window[name]);
}

/**
 * Safely get a global object/variable
 * @param {string} name - Global variable name
 * @param {*} defaultValue - Default if not found
 * @returns {*} Global value or default
 */
export function getGlobal(name, defaultValue = undefined) {
    if (typeof window === 'undefined') return defaultValue;
    return window[name] ?? defaultValue;
}

/**
 * Get base URL for API calls
 * @returns {string} API base URL
 */
export function getApiBaseUrl() {
    const configured = getEnv('VITE_API_BASE_URL') || getEnv('REACT_APP_API_URL');
    if (configured) return configured;

    if (isProduction()) {
        return 'https://api.sword-institute.com';
    }

    return 'http://localhost:3000';
}

/**
 * Get Firebase project configuration
 * @returns {Object} Firebase config object
 */
export function getFirebaseConfig() {
    return getGlobal('firebaseConfig') || {
        apiKey: getEnv('VITE_FIREBASE_API_KEY', ''),
        authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', ''),
        projectId: getEnv('VITE_FIREBASE_PROJECT_ID', ''),
        storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', ''),
        messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', ''),
        appId: getEnv('VITE_FIREBASE_APP_ID', ''),
    };
}

/**
 * Get AI service configuration
 * @returns {Object} AI service config
 */
export function getAIConfig() {
    return {
        provider: getEnv('VITE_AI_PROVIDER', 'openai'),
        apiKey: getEnv('VITE_AI_API_KEY', ''),
        model: getEnv('VITE_AI_MODEL', 'gpt-3.5-turbo'),
        baseUrl: getEnv('VITE_AI_BASE_URL', ''),
    };
}

/**
 * Log environment info (development only)
 * @returns {void}
 */
export function logEnvironmentInfo() {
    if (isDevelopment()) {
        console.group('%c⚙ Environment Info', 'color: purple; font-weight: bold');
        console.log('Mode:', isProduction() ? 'Production' : 'Development');
        console.log('API Base URL:', getApiBaseUrl());
        console.log('Firebase Config:', Boolean(getFirebaseConfig().projectId));
        console.log('AI Provider:', getAIConfig().provider);
        console.groupEnd();
    }
}

// Export default object
export default {
    isProduction,
    isDevelopment,
    getEnv,
    hasGlobal,
    getGlobal,
    getApiBaseUrl,
    getFirebaseConfig,
    getAIConfig,
    logEnvironmentInfo,
};
