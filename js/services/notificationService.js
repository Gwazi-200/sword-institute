import { read, write } from './storageService.js';

const NOTIFICATION_STORAGE_KEY = 'notifications';
const DEFAULT_NOTIFICATIONS = [
    { id: 1, title: 'New lesson ready', message: 'A new lesson has been published for your enrolled course.', unread: true, category: 'course' },
    { id: 2, title: 'Study streak', message: 'You are on a 5-day learning streak.', unread: false, category: 'reminder' },
    { id: 3, title: 'Certificate earned', message: 'Your latest certificate is ready to view.', unread: true, category: 'achievement' },
];

function getNotifications() {
    return read(NOTIFICATION_STORAGE_KEY, DEFAULT_NOTIFICATIONS);
}

function markAllRead() {
    const updated = getNotifications().map((item) => ({ ...item, unread: false }));
    write(NOTIFICATION_STORAGE_KEY, updated);
    return updated;
}

function addNotification(notification) {
    const next = { id: Date.now(), unread: true, ...notification };
    const updated = [next, ...getNotifications()];
    write(NOTIFICATION_STORAGE_KEY, updated);
    return next;
}

function archiveNotification(notificationId) {
    const updated = getNotifications().filter((item) => item.id !== notificationId);
    write(NOTIFICATION_STORAGE_KEY, updated);
    return updated;
}

function getUnreadCount() {
    return getNotifications().filter((item) => item.unread).length;
}

export { getNotifications, markAllRead, addNotification, archiveNotification, getUnreadCount, NOTIFICATION_STORAGE_KEY, DEFAULT_NOTIFICATIONS };
export default { getNotifications, markAllRead, addNotification, archiveNotification, getUnreadCount, NOTIFICATION_STORAGE_KEY, DEFAULT_NOTIFICATIONS };