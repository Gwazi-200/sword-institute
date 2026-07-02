/**
 * Compatibility re-export module.
 *
 * Some parts of the codebase import from "./firebase.js" or "../firebase.js".
 * The project’s canonical Firebase module is "./firebase-config.js".
 *
 * This file ensures those legacy imports continue to work without runtime
 * “Failed to resolve module specifier …” errors.
 */

export * from './firebase-config.js';
export { default } from './firebase-config.js';

