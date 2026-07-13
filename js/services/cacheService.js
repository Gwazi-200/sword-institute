import { read, write, remove } from './storageService.js';

const DEFAULT_TTL = 1000 * 60 * 5;
const CACHE_KEY_PREFIX = 'cache';

function getCacheKey(namespace) {
    return `${CACHE_KEY_PREFIX}:${namespace}`;
}

function getCachedValue(namespace, fallback = null) {
    try {
        const entry = read(getCacheKey(namespace), null);
        if (!entry) {
            return fallback;
        }

        if (entry.expiresAt && entry.expiresAt <= Date.now()) {
            remove(getCacheKey(namespace));
            return fallback;
        }

        return entry.value;
    } catch (error) {
        return fallback;
    }
}

function setCachedValue(namespace, value, options = {}) {
    const ttl = options.ttl ?? DEFAULT_TTL;
    const entry = {
        value,
        expiresAt: Date.now() + ttl,
        updatedAt: Date.now(),
    };

    return write(getCacheKey(namespace), entry);
}

function invalidateCache(namespace) {
    remove(getCacheKey(namespace));
}

function clearAllCaches() {
    const storageKeys = [];
    if (typeof window !== 'undefined' && window.localStorage) {
        for (let index = 0; index < window.localStorage.length; index += 1) {
            const key = window.localStorage.key(index);
            if (key && key.includes(`${CACHE_KEY_PREFIX}:`)) {
                storageKeys.push(key);
            }
        }
    }

    storageKeys.forEach((key) => window.localStorage.removeItem(key));
}

export { getCachedValue, setCachedValue, invalidateCache, clearAllCaches, DEFAULT_TTL };
export default { getCachedValue, setCachedValue, invalidateCache, clearAllCaches, DEFAULT_TTL };
