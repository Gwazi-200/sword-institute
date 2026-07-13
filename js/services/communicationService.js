import { getCurrentUser } from './authService.js';

function buildStorageKey(key) {
    return `instructor-studio:${key}`;
}

function readFallback(key, fallback) {
    try {
        const raw = window.localStorage.getItem(buildStorageKey(key));
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeFallback(key, value) {
    try {
        window.localStorage.setItem(buildStorageKey(key), JSON.stringify(value));
    } catch (error) {
        // Ignore storage errors and continue.
    }
}

function getAnnouncements() {
    return readFallback('announcements', [
        { id: 'a1', title: 'Weekly reminder', body: 'Please review your latest assessment feedback.' },
    ]);
}

function postAnnouncement(payload) {
    const next = [{ id: `${Date.now()}`, ...payload }, ...getAnnouncements()];
    writeFallback('announcements', next);
    return next[0];
}

function sendBroadcast(payload) {
    return postAnnouncement({ ...payload, channel: 'broadcast' });
}

export { getAnnouncements, postAnnouncement, sendBroadcast };
export default { getAnnouncements, postAnnouncement, sendBroadcast };
