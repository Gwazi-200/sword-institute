import { read, write } from './storageService.js';

const LOG_STORAGE_KEY = 'activity-log';
const MAX_LOG_ENTRIES = 200;

function sanitizePayload(payload = {}) {
    if (payload === null || payload === undefined) {
        return {};
    }

    if (typeof payload !== 'object') {
        return { value: String(payload) };
    }

    return payload;
}

function trackEvent(action, payload = {}) {
    const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        action,
        payload: sanitizePayload(payload),
        timestamp: new Date().toISOString(),
    };

    const existing = read(LOG_STORAGE_KEY, []);
    const nextEntries = [entry, ...existing].slice(0, MAX_LOG_ENTRIES);
    write(LOG_STORAGE_KEY, nextEntries);

    if (typeof window !== 'undefined' && window.console) {
        console.info(`[activity] ${action}`, payload);
    }

    return entry;
}

function getActivityLog() {
    return read(LOG_STORAGE_KEY, []);
}

function clearActivityLog() {
    write(LOG_STORAGE_KEY, []);
}

export { trackEvent, getActivityLog, clearActivityLog, LOG_STORAGE_KEY };
export default { trackEvent, getActivityLog, clearActivityLog, LOG_STORAGE_KEY };
