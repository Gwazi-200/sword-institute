const DEFAULT_NOTIFICATIONS = [
    { id: 1, title: 'New lesson ready', message: 'A new lesson has been published for your enrolled course.', unread: true },
    { id: 2, title: 'Study streak', message: 'You are on a 5-day learning streak.', unread: false }
];

function getNotifications() {
    return DEFAULT_NOTIFICATIONS;
}

function markAllRead() {
    return DEFAULT_NOTIFICATIONS.map((item) => ({ ...item, unread: false }));
}

function addNotification(notification) {
    const next = { id: Date.now(), ...notification };
    DEFAULT_NOTIFICATIONS.unshift(next);
    return next;
}

export { getNotifications, markAllRead, addNotification };
export default { getNotifications, markAllRead, addNotification };