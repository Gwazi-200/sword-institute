import { getStudentProfile } from './studentProfileService.js';
import { getTimeline } from './timelineService.js';
import { getCachedValue, setCachedValue } from './cacheService.js';
import { trackEvent } from './loggingService.js';

const ANALYTICS_CACHE_KEY = 'analytics-snapshot';

export async function getAnalyticsSnapshot(uid, options = {}) {
    const cacheKey = `${ANALYTICS_CACHE_KEY}:${uid || 'anonymous'}`;
    const cached = options.force ? null : getCachedValue(cacheKey, null);
    if (cached) {
        return cached;
    }

    const profile = await getStudentProfile(uid, { force: true });
    const timeline = await getTimeline(uid, 12);
    const completionRate = profile?.completedCourses?.length && profile?.currentCourses?.length
        ? Math.round((profile.completedCourses.length / (profile.completedCourses.length + profile.currentCourses.length)) * 100)
        : (profile?.completedCourses?.length ? 100 : 0);

    const snapshot = {
        learningTime: profile?.readingTime || 0,
        weeklyProgress: Math.min(100, Math.round((profile?.currentStreak || 0) * 8 + (profile?.xp || 0) / 10)),
        monthlyProgress: Math.min(100, Math.round((profile?.completedCourses?.length || 0) * 12 + (profile?.xp || 0) / 20)),
        completionRate,
        readingTrend: profile?.knowledgeHubHistory?.length ? Math.min(100, profile.knowledgeHubHistory.length * 8) : 0,
        quizTrend: profile?.averageQuizScore || 0,
        knowledgeGrowth: profile?.knowledgeHubHistory?.length || 0,
        currentStreak: profile?.currentStreak || 0,
        averageSession: Math.max(15, Math.round((profile?.readingTime || 0) / Math.max(1, timeline.length))),
        timeline,
    };

    setCachedValue(cacheKey, snapshot, { ttl: 1000 * 60 * 2 });
    return snapshot;
}

export async function trackLearningEvent(eventName, payload = {}) {
    trackEvent(eventName, payload);
    return payload;
}

export default { getAnalyticsSnapshot, trackLearningEvent };
