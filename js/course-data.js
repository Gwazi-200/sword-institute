const COURSE_STATE_STORAGE_KEY = 'sword_course_state';

export const DEFAULT_COURSES = [
    {
        id: 1,
        icon: '🌐',
        title: 'Web Alchemy',
        description: 'Modern HTML, CSS, and JavaScript to craft polished responsive experiences.',
        duration: '12 Weeks',
        tags: ['Frontend', 'HTML', 'CSS', 'JS'],
        category: 'Frontend'
    },
    {
        id: 2,
        icon: '🐍',
        title: 'Python Pathways',
        description: 'Build automation, data skills, and scripting confidence with Python.',
        duration: '10 Weeks',
        tags: ['Python', 'Data', 'Automation'],
        category: 'Python'
    },
    {
        id: 3,
        icon: '🧠',
        title: 'AI & Consciousness',
        description: 'Explore machine learning principles, ethics, and future-ready AI workflows.',
        duration: '14 Weeks',
        tags: ['AI', 'Machine Learning', 'Ethics'],
        category: 'AI'
    },
    {
        id: 4,
        icon: '📊',
        title: 'Data Science for Social Good',
        description: 'Use data to solve community problems and create measurable social impact.',
        duration: '8 Weeks',
        tags: ['Data Science', 'Statistics', 'Impact'],
        category: 'Data'
    }
];

function parseStoredState(rawValue) {
    if (!rawValue) return {};

    try {
        const parsed = JSON.parse(rawValue);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

export function readCourseState() {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    return parseStoredState(window.localStorage.getItem(COURSE_STATE_STORAGE_KEY));
}

export function saveCourseState(state) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(COURSE_STATE_STORAGE_KEY, JSON.stringify(state || {}));
}

export function isCourseEnrolled(courseId, state = readCourseState()) {
    const entry = state?.[String(courseId)];
    return Boolean(entry?.enrolled);
}

export function getCourseProgress(courseId, state = readCourseState()) {
    const entry = state?.[String(courseId)];
    const rawProgress = entry?.progress;
    if (typeof rawProgress !== 'number') return 0;
    return Math.min(100, Math.max(0, rawProgress));
}

export function upsertCourseState(courseId, updates = {}, state = readCourseState()) {
    const nextState = { ...(state || {}) };
    const normalizedId = String(courseId);
    const currentEntry = nextState[normalizedId] || {};

    nextState[normalizedId] = {
        ...currentEntry,
        ...updates,
        enrolled: updates.enrolled ?? currentEntry.enrolled ?? true,
        updatedAt: new Date().toISOString()
    };

    return nextState;
}

export function getEnrolledCourseCount(state = readCourseState()) {
    return Object.values(state || {}).filter(entry => Boolean(entry?.enrolled)).length;
}
