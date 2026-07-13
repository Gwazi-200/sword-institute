/**
 * ============================================================
 * Sword Institute LMS - Notification Manager Service
 * Version: 1.0.0
 * ============================================================
 *
 * Centralized notification management with:
 * - Single listener pattern (prevents duplicates)
 * - Subscriber notification system
 * - Notification state management
 * - Firestore real-time sync
 *
 * Usage:
 *   import { subscribeToNotifications, getNotifications } from './core/notificationManager.js';
 *
 *   // Subscribe to notification changes
 *   const unsub = subscribeToNotifications((notifications) => {
 *       console.log('Notifications updated:', notifications);
 *   });
 *
 *   // Get current notifications
 *   const notifications = getNotifications();
 *
 * ============================================================
 */

import { db } from '../firebase.js';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { getCurrentUserId } from './authService.js';
import { debug, error as logError, warn } from '../core/logger.js';

const MODULE = 'NotificationManager';

/**
 * Notification state management
 */
let notifications = [];
let notificationListeners = new Set();
let firestoreUnsubscribe = null;
let isInitialized = false;

/**
 * Initialize Firestore listener (called once)
 * @private
 * @returns {Promise<void>}
 */
async function initializeFirestoreListener() {
    if (isInitialized) {
        debug(MODULE, 'Notification listener already initialized');
        return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
        warn(MODULE, 'Cannot initialize notifications without user');
        return;
    }

    try {
        debug(MODULE, 'Initializing Firestore notification listener');

        const notifQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', userId)
        );

        firestoreUnsubscribe = onSnapshot(
            notifQuery,
            (snapshot) => {
                notifications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate?.() || new Date(),
                })).sort((a, b) => b.timestamp - a.timestamp);

                debug(MODULE, `Notifications updated: ${notifications.length} total`);
                notifySubscribers();
            },
            (err) => {
                logError(MODULE, 'Firestore listener error', err);
            }
        );

        isInitialized = true;
    } catch (err) {
        logError(MODULE, 'Failed to initialize Firestore listener', err);
    }
}

/**
 * Subscribe to notification changes
 * @param {Function} callback - Called with (notifications) array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToNotifications(callback) {
    if (!callback || typeof callback !== 'function') {
        warn(MODULE, 'subscribeToNotifications: callback is not a function');
        return () => {};
    }

    if (!isInitialized) {
        initializeFirestoreListener();
    }

    notificationListeners.add(callback);

    // Call immediately with current notifications
    callback(notifications);

    return () => {
        notificationListeners.delete(callback);
    };
}

/**
 * Get all notifications
 * @returns {Array} Notifications array
 */
export function getNotifications() {
    return [...notifications];
}

/**
 * Get unread notification count
 * @returns {number} Count of unread notifications
 */
export function getUnreadCount() {
    return notifications.filter(n => !n.read).length;
}

/**
 * Get notifications by type
 * @param {string} type - Notification type filter
 * @returns {Array} Filtered notifications
 */
export function getNotificationsByType(type) {
    return notifications.filter(n => n.type === type);
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export async function markAsRead(notificationId) {
    try {
        const notification = notifications.find(n => n.id === notificationId);
        if (!notification) {
            warn(MODULE, `Notification not found: ${notificationId}`);
            return;
        }

        await updateDoc(doc(db, 'notifications', notificationId), {
            read: true,
            readAt: new Date(),
        });

        debug(MODULE, `Marked as read: ${notificationId}`);
    } catch (err) {
        logError(MODULE, 'Failed to mark notification as read', err);
    }
}

/**
 * Mark all notifications as read
 * @returns {Promise<void>}
 */
export async function markAllAsRead() {
    try {
        const unreadNotifications = notifications.filter(n => !n.read);
        const updates = unreadNotifications.map(n =>
            updateDoc(doc(db, 'notifications', n.id), {
                read: true,
                readAt: new Date(),
            })
        );

        await Promise.all(updates);
        debug(MODULE, `Marked ${updates.length} notifications as read`);
    } catch (err) {
        logError(MODULE, 'Failed to mark all as read', err);
    }
}

/**
 * Notify all subscribers
 * @private
 */
function notifySubscribers() {
    notificationListeners.forEach((callback) => {
        try {
            callback([...notifications]);
        } catch (err) {
            logError(MODULE, 'Error in notification subscriber', err);
        }
    });
}

/**
 * Cleanup listener (usually on logout)
 */
export function cleanup() {
    debug(MODULE, 'Cleaning up notification manager');
    notificationListeners.clear();
    if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
        firestoreUnsubscribe = null;
    }
    notifications = [];
    isInitialized = false;
}

/**
 * Get initialization status
 * @returns {boolean}
 */
export function isInitialized() {
    return isInitialized;
}

/**
 * Get subscriber count (for debugging)
 * @returns {number}
 */
export function getSubscriberCount() {
    return notificationListeners.size;
}

export default {
    subscribeToNotifications,
    getNotifications,
    getUnreadCount,
    getNotificationsByType,
    markAsRead,
    markAllAsRead,
    cleanup,
    isInitialized,
    getSubscriberCount,
};
