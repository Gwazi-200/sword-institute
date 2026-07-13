/**
 * ============================================================
 * Sword Institute LMS
 * Centralized Logger Module
 * Version: 1.0.0
 * ============================================================
 *
 * Production-safe logging with development/production modes.
 * Development: Verbose logs, performance timing, initialization status.
 * Production: Warnings and errors only.
 *
 * All application logging goes through this module.
 * ============================================================
 */

const DEVELOPMENT_MODE = !('production' in import.meta.env ? import.meta.env.production : false);

const LOG_LEVEL = {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    FATAL: 5
};

let currentLogLevel = DEVELOPMENT_MODE ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN;

/**
 * Set minimum log level
 * @param {number} level - LOG_LEVEL value
 */
export function setLogLevel(level) {
    if (level in LOG_LEVEL) {
        currentLogLevel = level;
    }
}

/**
 * Check if should log at level
 * @param {number} level - LOG_LEVEL value
 * @returns {boolean} True if should log
 */
function shouldLog(level) {
    return level >= currentLogLevel;
}

/**
 * Format timestamp
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Format log prefix
 * @param {string} level - Log level name
 * @param {string} [module] - Module name
 * @returns {string} Formatted prefix
 */
function formatPrefix(level, module = '') {
    const timestamp = DEVELOPMENT_MODE ? `[${getTimestamp()}]` : '';
    const moduleLabel = module ? `[${module}]` : '';
    return `${timestamp}${moduleLabel}`;
}

/**
 * Log trace message (development only)
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @param {*} [data] - Optional data
 */
export function trace(module, message, data = null) {
    if (!shouldLog(LOG_LEVEL.TRACE)) return;
    console.log(`%c▶ ${formatPrefix('TRACE', module)} ${message}`, 'color: gray', data);
}

/**
 * Log debug message (development only)
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @param {*} [data] - Optional data
 */
export function debug(module, message, data = null) {
    if (!shouldLog(LOG_LEVEL.DEBUG)) return;
    console.log(`%c🔧 ${formatPrefix('DEBUG', module)} ${message}`, 'color: blue', data);
}

/**
 * Log info message
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @param {*} [data] - Optional data
 */
export function info(module, message, data = null) {
    if (!shouldLog(LOG_LEVEL.INFO)) return;
    console.log(`%cℹ ${formatPrefix('INFO', module)} ${message}`, 'color: cyan', data);
}

/**
 * Log performance timing
 * @param {string} module - Module name
 * @param {string} operation - Operation name
 * @param {number} durationMs - Duration in milliseconds
 */
export function timing(module, operation, durationMs) {
    if (!shouldLog(LOG_LEVEL.DEBUG)) return;
    const icon = durationMs < 100 ? '⚡' : durationMs < 500 ? '⏱' : '🐢';
    console.log(`%c${icon} ${formatPrefix('TIMING', module)} ${operation}: ${durationMs}ms`, 'color: green');
}

/**
 * Log warning message
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @param {*} [data] - Optional data
 */
export function warn(module, message, data = null) {
    if (!shouldLog(LOG_LEVEL.WARN)) return;
    console.warn(`${formatPrefix('WARN', module)} ${message}`, data);
}

/**
 * Log error message
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @param {*} [error] - Error object or data
 */
export function error(module, message, error = null) {
    if (!shouldLog(LOG_LEVEL.ERROR)) return;
    console.error(`${formatPrefix('ERROR', module)} ${message}`, error);
}

/**
 * Log fatal/critical error
 * @param {string} module - Module name
 * @param {string} message - Log message
 * @param {*} [error] - Error object or data
 */
export function fatal(module, message, error = null) {
    console.error(`%c💥 FATAL ${formatPrefix('FATAL', module)} ${message}`, 'color: red; font-weight: bold', error);
}

/**
 * Log initialization event
 * @param {string} module - Module name
 * @param {string} message - Log message
 */
export function init(module, message) {
    if (!shouldLog(LOG_LEVEL.INFO)) return;
    console.log(`%c⚙ INIT [${module}] ${message}`, 'color: purple; font-weight: bold');
}

/**
 * Log section header for organization
 * @param {string} title - Section title
 */
export function section(title) {
    if (!shouldLog(LOG_LEVEL.DEBUG)) return;
    console.log(`%c\n${'='.repeat(60)}\n  ${title}\n${'='.repeat(60)}`, 'color: darkblue; font-weight: bold');
}

/**
 * Create performance timer
 * @param {string} module - Module name
 * @param {string} label - Operation label
 * @returns {Object} Timer object with stop() method
 */
export function timer(module, label) {
    const startTime = performance.now();
    return {
        stop() {
            const duration = performance.now() - startTime;
            timing(module, label, Math.round(duration * 100) / 100);
            return duration;
        }
    };
}

/**
 * Safe async error handler
 * @param {Promise} promise - Promise to handle
 * @param {string} module - Module name
 * @param {string} context - Context description
 * @returns {Promise} Wrapped promise
 */
export async function asyncSafe(promise, module, context) {
    try {
        return await promise;
    } catch (err) {
        error(module, `Unhandled error in ${context}:`, err);
        throw err;
    }
}

/**
 * Development-only assertion
 * @param {boolean} condition - Condition to check
 * @param {string} module - Module name
 * @param {string} message - Assertion message
 */
export function assert(condition, module, message) {
    if (DEVELOPMENT_MODE && !condition) {
        fatal(module, `Assertion failed: ${message}`);
    }
}

export default {
    trace,
    debug,
    info,
    timing,
    warn,
    error,
    fatal,
    init,
    section,
    timer,
    asyncSafe,
    assert,
    setLogLevel,
    LOG_LEVEL,
    DEVELOPMENT_MODE
};
