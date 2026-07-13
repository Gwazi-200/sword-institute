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

function getPlannerItems() {
    return readFallback('planner', [
        { id: 'session-1', title: 'Live lab', type: 'session', date: '2026-07-15', time: '15:00' },
        { id: 'office-hours', title: 'Office hours', type: 'office', date: '2026-07-16', time: '10:00' },
    ]);
}

function addPlannerItem(item) {
    const next = [{ id: `${Date.now()}`, ...item }, ...getPlannerItems()];
    writeFallback('planner', next);
    return next;
}

export { getPlannerItems, addPlannerItem };
export default { getPlannerItems, addPlannerItem };
