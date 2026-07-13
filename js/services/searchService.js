import { getAllCourses } from './courseService.js';
import { getSettings } from './settingsService.js';

const DEFAULT_NAV_ITEMS = [
    { type: 'navigation', title: 'Home', description: 'Return to the main landing experience', url: 'index.html' },
    { type: 'navigation', title: 'Courses', description: 'Browse available learning pathways', url: 'courses.html' },
    { type: 'navigation', title: 'Dashboard', description: 'View learner progress and milestones', url: 'dashboard.html' },
    { type: 'navigation', title: 'Knowledge Hub', description: 'Read articles, books and research notes', url: 'knowledge-hub.html' },
    { type: 'navigation', title: 'Professor SWORD', description: 'Open the AI mentor experience', url: 'ai-message.html' },
    { type: 'navigation', title: 'Settings', description: 'Adjust learning and accessibility preferences', url: 'settings.html' },
];

const DEFAULT_SUPPORT_ARTICLES = [
    { type: 'support', title: 'How to enroll in a course', description: 'Step-by-step enrollment guidance', url: 'contact.html' },
    { type: 'support', title: 'How to reset your password', description: 'Use the password recovery flow', url: 'forgot-password.html' },
    { type: 'support', title: 'Theme and accessibility settings', description: 'Adjust contrast and motion preferences', url: 'settings.html' },
];

const DEFAULT_KNOWLEDGE_ITEMS = [
    { type: 'knowledge', title: 'Leadership Essentials', description: 'A practical guide for modern leadership', url: 'knowledge-hub.html' },
    { type: 'knowledge', title: 'AI for Educators', description: 'Curated articles and learning resources', url: 'knowledge-hub.html' },
    { type: 'knowledge', title: 'Career Readiness', description: 'Build a strong professional portfolio', url: 'career-centre.html' },
];

function normalizeText(value = '') {
    return String(value).toLowerCase().trim();
}

function scoreMatch(text, query) {
    const normalizedText = normalizeText(text);
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
        return 0;
    }

    if (normalizedText.includes(normalizedQuery)) {
        return 100;
    }

    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
    let score = 0;

    queryWords.forEach((word) => {
        if (normalizedText.includes(word)) {
            score += 18;
        } else if (word.length > 3 && normalizedText.includes(word.slice(0, 3))) {
            score += 6;
        }
    });

    return score;
}

async function search(query = '', options = {}) {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) {
        return [];
    }

    const [courses, settings] = await Promise.all([getAllCourses(), Promise.resolve(getSettings())]);
    const sources = [
        ...courses.map((course) => ({
            type: 'course',
            title: course.title,
            description: course.description || 'Course content',
            url: `course-view.html?course=${course.slug || course.courseId || course.id}`,
            tags: course.tags || [],
        })),
        ...DEFAULT_KNOWLEDGE_ITEMS,
        ...DEFAULT_SUPPORT_ARTICLES,
        ...DEFAULT_NAV_ITEMS,
        {
            type: 'settings',
            title: 'Settings',
            description: `Current theme: ${settings.theme}`,
            url: 'settings.html',
        },
        { type: 'achievement', title: 'Certificate milestone', description: 'Track your earned credentials', url: 'certificates.html' },
        { type: 'profile', title: 'Professor Memory', description: 'Private notes and recurring guidance', url: 'ai-message.html' },
    ];

    const scoredResults = sources
        .map((item) => {
            const haystack = [item.title, item.description, item.type, ...(item.tags || [])].join(' ');
            const score = scoreMatch(haystack, normalizedQuery);
            return { ...item, score };
        })
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score);

    return scoredResults.slice(0, options.limit || 8);
}

function registerGlobalSearch() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return () => {};
    }

    const onKeydown = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            window.dispatchEvent(new CustomEvent('sword:search-open'));
        }
    };

    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
}

export { search, registerGlobalSearch, DEFAULT_NAV_ITEMS, DEFAULT_SUPPORT_ARTICLES, DEFAULT_KNOWLEDGE_ITEMS };
export default { search, registerGlobalSearch, DEFAULT_NAV_ITEMS, DEFAULT_SUPPORT_ARTICLES, DEFAULT_KNOWLEDGE_ITEMS };
