/**
 * ============================================================
 * Sword Institute LMS
 * Application Initialization Manager
 * Version: 1.0.0
 * ============================================================
 *
 * Centralized lifecycle management for all services.
 * Prevents duplicate initialization and race conditions.
 *
 * Each service initializes exactly once in proper order:
 * 1. Firebase (already done by firebase-config.js)
 * 2. Theme
 * 3. Authentication
 * 4. Notifications
 * 5. Professor SWORD AI
 * 6. Course Service
 * 7. Knowledge Hub
 * 8. Analytics
 * 9. Gamification
 * 10. User Profile
 *
 * All components wait for DOMContentLoaded and init completion.
 * ============================================================
 */

import { info, warn, error, init, section, timer } from './logger.js';

const MODULE = 'AppInitializer';

/**
 * Service initialization state
 */
const services = new Map();
const initializationOrder = [
    'theme',
    'auth',
    'notifications',
    'aiService',
    'courseService',
    'knowledgeHub',
    'analytics',
    'gamification',
    'userProfile'
];

let isInitializing = false;
let isInitialized = false;
const pendingPromise = new Promise((resolve, reject) => {
    window.__appInitResolve = resolve;
    window.__appInitReject = reject;
});

/**
 * Register a service with initialization handler
 * @param {string} serviceName - Service name
 * @param {Function} initHandler - Async function that initializes the service
 * @param {Object} [options] - Options
 * @param {boolean} [options.critical] - If true, init failure stops entire app
 * @param {string[]} [options.dependsOn] - Services that must init first
 */
export function registerService(serviceName, initHandler, options = {}) {
    if (isInitialized) {
        warn(MODULE, `Service "${serviceName}" registered after initialization complete`);
    }

    services.set(serviceName, {
        name: serviceName,
        handler: initHandler,
        critical: options.critical || false,
        dependsOn: options.dependsOn || [],
        state: 'pending',
        startTime: null,
        endTime: null,
        duration: 0,
        error: null
    });

    info(MODULE, `Service registered: ${serviceName}`);
}

/**
 * Check if service is initialized
 * @param {string} serviceName - Service name
 * @returns {boolean} True if service completed initialization
 */
export function isServiceInitialized(serviceName) {
    const svc = services.get(serviceName);
    return svc ? svc.state === 'initialized' : false;
}

/**
 * Get service state
 * @param {string} serviceName - Service name
 * @returns {string} Service state: 'pending', 'initializing', 'initialized', 'failed'
 */
export function getServiceState(serviceName) {
    const svc = services.get(serviceName);
    return svc ? svc.state : 'unknown';
}

/**
 * Get initialization report
 * @returns {Object} Detailed initialization report
 */
export function getInitReport() {
    const report = {
        isInitialized,
        isInitializing,
        timestamp: new Date().toISOString(),
        services: {}
    };

    services.forEach((svc) => {
        report.services[svc.name] = {
            state: svc.state,
            duration: svc.duration,
            error: svc.error ? svc.error.message : null
        };
    });

    return report;
}

/**
 * Log initialization report
 */
function logInitReport() {
    const report = getInitReport();
    if (report.isInitialized) {
        info(MODULE, '✅ Application initialized successfully');
    } else {
        warn(MODULE, '⚠️ Application initialization incomplete', report);
    }

    section('Initialization Report');
    Object.entries(report.services).forEach(([name, status]) => {
        const icon =
            status.state === 'initialized' ? '✔' :
            status.state === 'failed' ? '✘' :
            status.state === 'initializing' ? '⟳' :
            '○';
        const duration = status.duration ? ` (${status.duration}ms)` : '';
        console.log(`  ${icon} ${name}${duration}`);
        if (status.error) {
            console.error(`    Error: ${status.error}`);
        }
    });
}

/**
 * Wait for DOMContentLoaded
 * @returns {Promise<void>}
 */
function waitForDOM() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        } else {
            resolve();
        }
    });
}

/**
 * Initialize a single service
 * @param {string} serviceName - Service name
 * @returns {Promise<boolean>} True if successful
 */
async function initializeService(serviceName) {
    const svc = services.get(serviceName);
    if (!svc) {
        warn(MODULE, `Service "${serviceName}" not found`);
        return false;
    }

    // Check dependencies
    for (const depName of svc.dependsOn) {
        const dep = services.get(depName);
        if (!dep || dep.state !== 'initialized') {
            warn(MODULE, `Service "${serviceName}" skipped: dependency "${depName}" not ready`);
            return false;
        }
    }

    svc.state = 'initializing';
    svc.startTime = performance.now();

    try {
        init(MODULE, `Initializing ${serviceName}...`);
        await svc.handler();
        svc.state = 'initialized';
        svc.endTime = performance.now();
        svc.duration = Math.round(svc.endTime - svc.startTime);
        info(MODULE, `✔ ${serviceName} initialized (${svc.duration}ms)`);
        return true;
    } catch (err) {
        svc.state = 'failed';
        svc.error = err;
        svc.endTime = performance.now();
        svc.duration = Math.round(svc.endTime - svc.startTime);

        if (svc.critical) {
            error(MODULE, `CRITICAL SERVICE FAILED: ${serviceName}`, err);
            return false;
        } else {
            warn(MODULE, `Non-critical service failed: ${serviceName}`, err);
            return false; // Still return false, but don't block others
        }
    }
}

/**
 * Run full initialization sequence
 * @returns {Promise<void>}
 */
async function runInitializationSequence() {
    if (isInitializing || isInitialized) {
        warn(MODULE, 'Initialization already in progress or complete');
        return;
    }

    isInitializing = true;

    try {
        section('Application Initialization Started');

        // Wait for DOM to be ready
        await waitForDOM();
        info(MODULE, 'DOM ready');

        // Initialize services in order
        for (const serviceName of initializationOrder) {
            if (services.has(serviceName)) {
                const success = await initializeService(serviceName);
                if (!success && services.get(serviceName).critical) {
                    throw new Error(`Critical service failed: ${serviceName}`);
                }
            }
        }

        // Initialize any registered services not in the main order
        for (const [serviceName, svc] of services) {
            if (svc.state === 'pending') {
                const success = await initializeService(serviceName);
                if (!success && svc.critical) {
                    throw new Error(`Critical service failed: ${serviceName}`);
                }
            }
        }

        isInitialized = true;
        logInitReport();

        if (window.__appInitResolve) {
            window.__appInitResolve();
        }
    } catch (err) {
        error(MODULE, 'Initialization sequence failed', err);
        logInitReport();

        if (window.__appInitReject) {
            window.__appInitReject(err);
        }
    } finally {
        isInitializing = false;
    }
}

/**
 * Start initialization when DOM is ready
 */
export function initializeApplication() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInitializationSequence, { once: true });
    } else {
        runInitializationSequence();
    }
}

/**
 * Wait for application initialization to complete
 * @returns {Promise<void>} Resolves when all services initialized
 */
export function waitForInitialization() {
    return pendingPromise;
}

/**
 * Export initialization state and status
 */
export {
    isInitialized,
    isInitializing,
    pendingPromise
};

export default {
    registerService,
    isServiceInitialized,
    getServiceState,
    getInitReport,
    initializeApplication,
    waitForInitialization
};
