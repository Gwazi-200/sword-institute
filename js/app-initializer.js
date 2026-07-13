/**
 * ============================================================
 * Sword Institute LMS - Application Initializer
 * Version: 2.0.0
 * ============================================================
 *
 * Single entry point for all application initialization.
 * Coordinates services, prevents duplicate initialization,
 * manages dependencies, and handles errors.
 *
 * Usage in any HTML file:
 *
 *   <script type="module">
 *       import { initializeApplication } from './js/app-initializer.js';
 *       initializeApplication();
 *   </script>
 *
 * Or in other ES modules:
 *
 *   import { initializeApplication, onAppReady } from './js/app-initializer.js';
 *   await initializeApplication();
 *   console.log('App is ready!');
 *
 * ============================================================
 */

import { isDevelopment } from './core/environmentService.js';
import { debug, error as logError, info, section, init } from './core/logger.js';

const MODULE = 'AppInitializer';

/**
 * Initialization state
 */
let isInitializing = false;
let isInitialized = false;
let readyCallbacks = new Set();
const services = new Map();

/**
 * Register a service for initialization
 * @param {string} name - Service name
 * @param {Function} initFn - Async init function
 * @param {Array<string>} dependencies - Service dependencies
 */
export function registerService(name, initFn, dependencies = []) {
    if (services.has(name)) {
        debug(MODULE, `Service "${name}" already registered`);
        return;
    }

    services.set(name, {
        name,
        initFn,
        dependencies,
        initialized: false,
        error: null,
    });

    debug(MODULE, `Registered service: ${name}`);
}

/**
 * Main initialization function
 * @returns {Promise<void>}
 */
export async function initializeApplication() {
    if (isInitialized) {
        debug(MODULE, 'Application already initialized');
        return;
    }

    if (isInitializing) {
        debug(MODULE, 'Application initialization in progress, waiting...');
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (isInitialized) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });
    }

    isInitializing = true;

    try {
        section('🚀 Application Initialization');

        // 1. Wait for DOM
        await waitForDOMReady();

        // 2. Initialize built-in services
        await initializeBuiltInServices();

        // 3. Initialize registered services
        await initializeRegisteredServices();

        // 4. Mark as ready
        isInitialized = true;
        isInitializing = false;

        info(MODULE, '✅ Application initialized successfully');
        notifyReadyCallbacks();

        section('Application ready');
    } catch (err) {
        isInitializing = false;
        logError(MODULE, 'Application initialization failed', err);
        throw err;
    }
}

/**
 * Wait for DOM to be ready
 * @private
 * @returns {Promise<void>}
 */
function waitForDOMReady() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            debug(MODULE, 'Waiting for DOM...');
            document.addEventListener('DOMContentLoaded', () => {
                debug(MODULE, 'DOM is ready');
                resolve();
            }, { once: true });
        } else {
            debug(MODULE, 'DOM already ready');
            resolve();
        }
    });
}

/**
 * Initialize built-in services (core, auth, etc.)
 * @private
 * @returns {Promise<void>}
 */
async function initializeBuiltInServices() {
    section('Initializing core services');

    try {
        // Import and init core services
        const { initializeAuthListener } = await import('./services/authService.js');
        debug(MODULE, 'Auth service ready');

        // Theme service
        const { applyTheme, getStoredTheme } = await import('./services/themeService.js');
        const theme = getStoredTheme();
        applyTheme(theme);
        debug(MODULE, `Theme applied: ${theme}`);

        // Course service (preload cache if available)
        const { getCacheStatus } = await import('./services/courseService.js');
        const cacheStatus = getCacheStatus?.();
        if (cacheStatus) {
            debug(MODULE, `Course cache status: ${cacheStatus}`);
        }

        // AI Service initialization
        try {
            const { initializeAI } = await import('./services/aiServiceInit.js');
            await initializeAI();
            debug(MODULE, 'AI service initialized');
        } catch (err) {
            debug(MODULE, 'AI service initialization skipped (optional)', err);
        }

        // Notification Manager is lazy-loaded on demand
        debug(MODULE, 'Notification manager ready (lazy-loaded)');

        info(MODULE, '✅ Core services initialized');
    } catch (err) {
        logError(MODULE, 'Failed to initialize core services', err);
        // Don't throw - core services should be optional
    }
}

/**
 * Initialize registered services with dependency management
 * @private
 * @returns {Promise<void>}
 */
async function initializeRegisteredServices() {
    if (services.size === 0) {
        debug(MODULE, 'No additional services registered');
        return;
    }

    section(`Initializing ${services.size} registered services`);

    const initialized = new Set();

    /**
     * Initialize service recursively with dependencies
     */
    async function initService(name) {
        if (initialized.has(name)) {
            return;
        }

        const service = services.get(name);
        if (!service) {
            throw new Error(`Service not found: ${name}`);
        }

        // Initialize dependencies first
        for (const dep of service.dependencies) {
            if (!initialized.has(dep)) {
                await initService(dep);
            }
        }

        // Initialize this service
        try {
            init(MODULE, `Initializing ${name}...`);
            if (service.initFn) {
                await service.initFn();
            }
            service.initialized = true;
            initialized.add(name);
            debug(MODULE, `✅ ${name} initialized`);
        } catch (err) {
            service.error = err;
            logError(MODULE, `Failed to initialize ${name}`, err);
            throw err;
        }
    }

    // Initialize all services
    for (const [name] of services) {
        try {
            await initService(name);
        } catch (err) {
            if (isDevelopment()) {
                console.error(`Service initialization failed: ${name}`, err);
            }
        }
    }

    info(MODULE, `✅ ${initialized.size} services initialized`);
}

/**
 * Wait for application to be ready
 * @returns {Promise<void>}
 */
export async function onAppReady() {
    if (isInitialized) {
        return;
    }

    return new Promise((resolve) => {
        readyCallbacks.add(resolve);
    });
}

/**
 * Subscribe to app ready events
 * @param {Function} callback - Called when app is ready
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAppReady(callback) {
    if (isInitialized) {
        callback();
    } else {
        readyCallbacks.add(callback);
    }

    return () => {
        readyCallbacks.delete(callback);
    };
}

/**
 * Notify all ready callbacks
 * @private
 */
function notifyReadyCallbacks() {
    readyCallbacks.forEach((callback) => {
        try {
            callback();
        } catch (err) {
            logError(MODULE, 'Error in ready callback', err);
        }
    });
}

/**
 * Get initialization status
 * @returns {Object}
 */
export function getInitStatus() {
    const serviceStatus = Array.from(services.entries()).map(([name, service]) => ({
        name,
        initialized: service.initialized,
        error: service.error ? String(service.error) : null,
    }));

    return {
        isInitialized,
        isInitializing,
        services: serviceStatus,
    };
}

/**
 * Log initialization status (debugging)
 */
export function logInitStatus() {
    if (!isDevelopment()) return;

    const status = getInitStatus();
    console.group('%c⚙ Initialization Status', 'color: purple; font-weight: bold');
    console.log('Initialized:', status.isInitialized);
    console.log('Initializing:', status.isInitializing);
    console.log('Services:', status.services);
    console.groupEnd();
}

// Initialize on import if in module context
if (typeof window !== 'undefined' && window.document) {
    // Don't auto-init - let callers decide
    debug(MODULE, 'App initializer loaded (manual initialization required)');
}

export default {
    initializeApplication,
    onAppReady,
    subscribeToAppReady,
    registerService,
    getInitStatus,
    logInitStatus,
};
