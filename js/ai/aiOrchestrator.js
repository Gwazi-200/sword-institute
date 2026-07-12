const AI_CACHE = new Map();
const IN_FLIGHT = new Map();

const DEFAULT_FALLBACKS = {
    chat: 'Professor SWORD is here to support your learning journey. I will help you stay focused, understand ideas clearly, and keep moving forward.',
    recommendation: 'I recommend exploring one of the available courses that matches your current goals and interests.',
    studyPlan: 'A short study plan will help you build momentum. Focus on one lesson, one review session, and one practical action today.',
    quiz: 'A practice quiz is ready to help you test your understanding. Start with one concept at a time and review the answer carefully.',
    flashcards: 'Flashcards are an effective way to reinforce key ideas. Keep your revision brief, consistent, and focused on recall.'
};

function buildCacheKey(type, payload) {
    const normalized = JSON.stringify(payload || {});
    return `${type}:${normalized}`;
}

function getCachedResponse(cacheKey) {
    const cached = AI_CACHE.get(cacheKey);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > 45000) {
        AI_CACHE.delete(cacheKey);
        return null;
    }

    return cached.value;
}

function setCachedResponse(cacheKey, value) {
    AI_CACHE.set(cacheKey, { value, timestamp: Date.now() });
}

function getFallbackResponse(type, payload) {
    const message = String(payload?.message || payload?.prompt || '');
    const lower = message.toLowerCase();

    if (type === 'recommendation') {
        return DEFAULT_FALLBACKS.recommendation;
    }

    if (type === 'studyPlan') {
        return DEFAULT_FALLBACKS.studyPlan;
    }

    if (type === 'quiz') {
        return DEFAULT_FALLBACKS.quiz;
    }

    if (type === 'flashcards') {
        return DEFAULT_FALLBACKS.flashcards;
    }

    if (lower.includes('study') || lower.includes('plan')) {
        return DEFAULT_FALLBACKS.studyPlan;
    }

    if (lower.includes('quiz') || lower.includes('test')) {
        return DEFAULT_FALLBACKS.quiz;
    }

    if (lower.includes('flashcard') || lower.includes('card')) {
        return DEFAULT_FALLBACKS.flashcards;
    }

    return DEFAULT_FALLBACKS.chat;
}

function resolveServiceType(intent, payload) {
    const message = String(payload?.message || payload?.prompt || '').toLowerCase();

    if (intent === 'recommendation' || message.includes('recommend') || message.includes('next course')) {
        return 'recommendation';
    }

    if (intent === 'studyPlan' || message.includes('study plan') || message.includes('weekly')) {
        return 'studyPlan';
    }

    if (intent === 'quiz' || message.includes('quiz') || message.includes('test my knowledge')) {
        return 'quiz';
    }

    if (intent === 'flashcards' || message.includes('flashcard')) {
        return 'flashcards';
    }

    return 'chat';
}

export async function askProfessorSWORD(payload = {}, options = {}) {
    const type = resolveServiceType(options.intent || payload.intent || 'chat', payload);
    const cacheKey = buildCacheKey(type, payload);

    const cached = getCachedResponse(cacheKey);
    if (cached) {
        return { ok: true, source: 'cache', response: cached };
    }

    if (IN_FLIGHT.has(cacheKey)) {
        return IN_FLIGHT.get(cacheKey);
    }

    const requestPromise = (async () => {
        try {
            const callable = options.getCallable || null;
            if (typeof callable !== 'function') {
                throw new Error('No callable function provided for AI orchestration.');
            }

            const result = await callable({
                type,
                message: payload.message || payload.prompt || '',
                context: payload.context || options.context || 'general',
                lessonContent: payload.lessonContent || payload.lesson || '',
                studentData: payload.studentData || options.studentData || {}
            });

            const responseText = result?.reply || result?.response || result?.recommendation || '';
            if (responseText) {
                setCachedResponse(cacheKey, responseText);
                return { ok: true, source: 'cloud-function', response: responseText, meta: result };
            }

            const fallback = getFallbackResponse(type, payload);
            setCachedResponse(cacheKey, fallback);
            return { ok: true, source: 'fallback', response: fallback, meta: result };
        } catch (error) {
            const fallback = getFallbackResponse(type, payload);
            setCachedResponse(cacheKey, fallback);
            return { ok: false, source: 'fallback', response: fallback, error: error?.message || 'AI request failed' };
        } finally {
            IN_FLIGHT.delete(cacheKey);
        }
    })();

    IN_FLIGHT.set(cacheKey, requestPromise);
    return requestPromise;
}

export function getAiModuleStatus() {
    return {
        cacheSize: AI_CACHE.size,
        inFlight: IN_FLIGHT.size,
        fallbackDefaults: Object.keys(DEFAULT_FALLBACKS)
    };
}
