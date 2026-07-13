/**
 * ============================================================
 * Sword Institute LMS - Unified Auth Service
 * Version: 1.1.0
 * ============================================================
 *
 * Centralized authentication with single listener pattern
 * Prevents duplicate auth state changes from firing
 *
 * ============================================================
 */

import { auth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../firebase.js';
import { trackEvent } from './loggingService.js';
import { handleError } from './errorService.js';
import { debug, error as logError } from '../core/logger.js';

const MODULE = 'AuthService';

/**
 * Central auth state management (single listener pattern)
 */
let currentUser = auth.currentUser || null;
let authListeners = new Set();
let centralUnsubscribe = null;
let isInitialized = false;

/**
 * Initialize centralized auth listener (prevents duplicates)
 * @private
 */
function initializeCentralAuthListener() {
    if (isInitialized) return;

    debug(MODULE, 'Initializing centralized auth listener');

    centralUnsubscribe = onAuthStateChanged(auth, (user) => {
        currentUser = user;

        if (user) {
            debug(MODULE, `Auth state changed: User signed in (${user.uid})`);
        } else {
            debug(MODULE, 'Auth state changed: User signed out');
        }

        // Notify all registered listeners
        authListeners.forEach((listener) => {
            try {
                listener(user);
            } catch (err) {
                logError(MODULE, 'Error in auth listener', err);
            }
        });
    });

    isInitialized = true;
}

/**
 * Subscribe to auth state changes (centralized listener)
 * @param {Function} listener - Callback(user)
 * @returns {Function} Unsubscribe function
 */
function subscribeToAuth(listener) {
    // Ensure central listener is initialized
    if (!isInitialized) {
        initializeCentralAuthListener();
    }

    if (typeof listener !== 'function') {
        console.warn('subscribeToAuth: listener must be a function');
        return () => {};
    }

    authListeners.add(listener);

    // Call immediately with current user
    listener(currentUser);

    // Return unsubscribe function
    return () => {
        authListeners.delete(listener);
    };
}

/**
 * Get all subscribed auth listeners (debugging)
 * @returns {number}
 */
function getAuthListenerCount() {
    return authListeners.size;
}

async function signOutUser() {
    try {
        await signOut(auth);
        trackEvent('logout');
        return true;
    } catch (error) {
        handleError(error, 'auth');
        return false;
    }
}

async function signIn(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        trackEvent('login', { uid: result?.user?.uid });
        return result;
    } catch (error) {
        handleError(error, 'auth');
        throw error;
    }
}

async function register(email, password, displayName) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
            await updateProfile(result.user, { displayName });
        }
        trackEvent('register', { uid: result?.user?.uid, displayName });
        return result;
    } catch (error) {
        handleError(error, 'auth');
        throw error;
    }
}

function getCurrentUser() {
    return auth.currentUser;
}

function getDisplayName(user = getCurrentUser()) {
    return user?.displayName || user?.email || 'Learner';
}

function getUserInitials(user = getCurrentUser()) {
    const name = getDisplayName(user);
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'L';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export { subscribeToAuth, signOutUser, signIn, register, getCurrentUser, getDisplayName, getUserInitials, getAuthListenerCount };
export default { subscribeToAuth, signOutUser, signIn, register, getCurrentUser, getDisplayName, getUserInitials, getAuthListenerCount };