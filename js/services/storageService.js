const STORAGE_NAMESPACE = 'sword-institute';

function getStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return null;
    }
    return window.localStorage;
}

function getStorageKey(key) {
    return `${STORAGE_NAMESPACE}:${key}`;
}

function read(key, fallback = null) {
    const storage = getStorage();
    if (!storage) {
        return fallback;
    }

    try {
        const raw = storage.getItem(getStorageKey(key));
        return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
        return fallback;
    }
}

function write(key, value) {
    const storage = getStorage();
    if (!storage) {
        return value;
    }

    try {
        storage.setItem(getStorageKey(key), JSON.stringify(value));
        return value;
    } catch (error) {
        console.warn(`Unable to write storage key ${key}`, error);
        return value;
    }
}

function remove(key) {
    const storage = getStorage();
    if (!storage) {
        return;
    }

    storage.removeItem(getStorageKey(key));
}

function clear() {
    const storage = getStorage();
    if (!storage) {
        return;
    }

    Object.keys(storage).forEach((itemKey) => {
        if (itemKey.startsWith(STORAGE_NAMESPACE)) {
            storage.removeItem(itemKey);
        }
    });
}

export { read, write, remove, clear, getStorageKey, STORAGE_NAMESPACE };
export default { read, write, remove, clear, getStorageKey, STORAGE_NAMESPACE };
