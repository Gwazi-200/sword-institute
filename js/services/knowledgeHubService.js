import { getCachedValue, setCachedValue } from './cacheService.js';

const KNOWLEDGE_CACHE_KEY = 'knowledge-hub';

const DEFAULT_ARTICLES = [
    { id: 'leadership', title: 'Leadership Essentials', type: 'article', url: 'knowledge-hub.html' },
    { id: 'ai', title: 'AI for Educators', type: 'article', url: 'knowledge-hub.html' },
    { id: 'career', title: 'Career Success Framework', type: 'article', url: 'knowledge-hub.html' },
];

export async function getKnowledgeHubItems(forceRefresh = false) {
    const cacheKey = `${KNOWLEDGE_CACHE_KEY}:${forceRefresh ? 'refresh' : 'default'}`;
    const cached = forceRefresh ? null : getCachedValue(cacheKey, null);
    if (cached) {
        return cached;
    }

    const items = DEFAULT_ARTICLES;
    setCachedValue(cacheKey, items, { ttl: 1000 * 60 * 3 });
    return items;
}

export default { getKnowledgeHubItems };