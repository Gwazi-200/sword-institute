/**
 * ============================================================
 * Sword Institute LMS - Unified AI Service Initializer
 * Version: 1.0.0
 * ============================================================
 *
 * Centralized AI service initialization.
 * Prevents duplicate AI initialization across multiple files.
 *
 * Usage:
 *   import { initializeAI, getAIService, isAIReady } from './services/aiServiceInit.js';
 *
 *   await initializeAI();
 *   if (isAIReady()) {
 *       const aiService = getAIService();
 *       // Use AI service
 *   }
 *
 * ============================================================
 */

import { auth } from '../firebase.js';
import { debug, error as logError, info } from '../core/logger.js';

const MODULE = 'AIServiceInit';

/**
 * AI service state
 */
let aiService = null;
let isInitializing = false;
let isReady = false;
let initPromise = null;

/**
 * Initialize AI service (called once during app startup)
 * @param {Object} config - Configuration options
 * @returns {Promise<Object>} AI service instance
 */
export async function initializeAI(config = {}) {
    // Return existing promise if already initializing
    if (isInitializing) {
        debug(MODULE, 'AI initialization already in progress, waiting...');
        return initPromise;
    }

    // Return service if already initialized
    if (isReady && aiService) {
        debug(MODULE, 'AI service already initialized');
        return aiService;
    }

    isInitializing = true;

    initPromise = (async () => {
        try {
            debug(MODULE, 'Initializing AI service');

            // Import AI service module
            const module = await import('../ai-service.js');
            const AIServiceModule = module.default || module;
            aiService = AIServiceModule;

            // Apply configuration if available
            if (config.apiKey && typeof aiService.setAPIKey === 'function') {
                aiService.setAPIKey(config.apiKey);
            }
            if (config.model && typeof aiService.setModel === 'function') {
                aiService.setModel(config.model);
            }
            if (config.provider && typeof aiService.setProvider === 'function') {
                aiService.setProvider(config.provider);
            }

            // Initialize auth listener for AI
            if (auth && typeof aiService.setAuth === 'function') {
                aiService.setAuth(auth);
            }

            // Mark as ready
            isReady = true;
            info(MODULE, '✅ AI service initialized successfully');

            return aiService;
        } catch (err) {
            logError(MODULE, 'Failed to initialize AI service', err);
            isReady = false;
            throw err;
        } finally {
            isInitializing = false;
        }
    })();

    return initPromise;
}

/**
 * Wait for AI service to be ready
 * @returns {Promise<Object>} AI service instance
 */
export async function waitForAI() {
    if (isReady && aiService) {
        return aiService;
    }

    if (isInitializing) {
        return initPromise;
    }

    // If not started, initialize it
    return initializeAI();
}

/**
 * Get AI service instance (synchronous)
 * Returns null if not yet initialized
 * @returns {Object|null} AI service or null
 */
export function getAIService() {
    if (!isReady) {
        debug(MODULE, 'AI service not ready yet');
        return null;
    }
    return aiService;
}

/**
 * Check if AI service is ready
 * @returns {boolean} True if AI service is initialized
 */
export function isAIReady() {
    return isReady && aiService !== null;
}

/**
 * Check if AI service is currently initializing
 * @returns {boolean} True if initialization in progress
 */
export function isAIInitializing() {
    return isInitializing;
}

/**
 * Send message to AI (convenience method)
 * @param {string} message - User message
 * @param {Object} context - Optional context
 * @returns {Promise<string>} AI response
 */
export async function sendAIMessage(message, context = {}) {
    const service = await waitForAI();
    if (!service || !service.sendMessage) {
        throw new Error('AI service not available');
    }

    try {
        const response = await service.sendMessage(message, context);
        return response;
    } catch (err) {
        logError(MODULE, 'Failed to send AI message', err);
        throw err;
    }
}

/**
 * Reset AI service (for testing/dev)
 * @private
 */
export function _reset() {
    aiService = null;
    isReady = false;
    isInitializing = false;
    initPromise = null;
}

export default {
    initializeAI,
    waitForAI,
    getAIService,
    isAIReady,
    isAIInitializing,
    sendAIMessage,
    _reset, // For testing only
};
