import { getAllCourses, getFeaturedCourses, getPopularCourses, searchCourses } from './courseService.js';

const discoveryCache = new Map();
const CACHE_TTL_MS = 45000;

function getCacheKey(key) {
    return `discovery:${key}`;
}

function getCached(key) {
    const cached = discoveryCache.get(getCacheKey(key));
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        discoveryCache.delete(getCacheKey(key));
        return null;
    }
    return cached.value;
}

function setCached(key, value) {
    discoveryCache.set(getCacheKey(key), { value, timestamp: Date.now() });
}

async function getDiscoveryData() {
    const cached = getCached('catalog');
    if (cached) return cached;

    const [allCourses, featured, popular] = await Promise.all([
        getAllCourses(),
        getFeaturedCourses(6),
        getPopularCourses(6)
    ]);

    const data = {
        allCourses,
        featured,
        popular,
        categories: Array.from(new Set(allCourses.map((course) => course.category).filter(Boolean)))
    };

    setCached('catalog', data);
    return data;
}

async function searchDiscoveryCourses(query = '') {
    const trimmed = String(query || '').trim();
    if (!trimmed) {
        const data = await getDiscoveryData();
        return data.allCourses;
    }
    return searchCourses(trimmed);
}

export { getDiscoveryData, searchDiscoveryCourses };
export default { getDiscoveryData, searchDiscoveryCourses };