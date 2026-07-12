/**
 * ============================================================
 * Sword Institute LMS
 * Learning Collection Service
 * Version: 1.0.0
 * ============================================================
 *
 * Manages curated learning collections and resource bundles.
 *
 * Features:
 * - Curated collections (admin-created)
 * - Personal collections (student-created)
 * - Collection sharing
 * - Collaborative learning bundles
 * - Collection search and discovery
 *
 * ============================================================
 */

import {
    collection,
    doc,
    query,
    where,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";

// Cache configuration
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let cache = {
    collections: new Map(),
    collections_by_student: new Map(),
    resources: new Map(),
};
let cacheTimestamps = {
    collections: new Map(),
    collections_by_student: new Map(),
    resources: new Map(),
};

/**
 * Get all learning collections
 *
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of collection objects
 *
 * @example
 * const collections = await getLearningCollections({
 *   type: "curated", // or "personal"
 *   limit: 20
 * });
 */
export async function getLearningCollections(options = {}) {
    try {
        const cacheKey = `all_${options.type || "all"}`;

        // Check cache
        if (cache.collections.has(cacheKey) && isValidCache("collections", cacheKey)) {
            return cache.collections.get(cacheKey);
        }

        const collRef = collection(db, "learning_collections");
        let q = collRef;

        if (options.type) {
            q = query(collRef, where("type", "==", options.type));
        } else {
            q = query(collRef, where("isPublished", "==", true));
        }

        const snapshot = await getDocs(q);
        const collections = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Sort by creation date (newest first)
        collections.sort((a, b) => b.createdAt - a.createdAt);

        // Cache
        setCache("collections", cacheKey, collections);

        return collections.slice(0, options.limit || 50);
    } catch (error) {
        console.error("[LearningCollectionService] Error getting collections:", error);
        throw error;
    }
}

/**
 * Get collection by ID
 *
 * @param {string} collectionId - Collection ID
 * @returns {Promise<Object|null>} Collection object or null if not found
 *
 * @example
 * const collection = await getCollectionById("coll_001");
 * console.log(collection.title);
 */
export async function getCollectionById(collectionId) {
    try {
        // Check cache
        if (cache.collections.has(collectionId) && isValidCache("collections", collectionId)) {
            return cache.collections.get(collectionId);
        }

        const docSnapshot = await getDoc(doc(db, "learning_collections", collectionId));

        if (!docSnapshot.exists()) {
            return null;
        }

        const collectionData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
        };

        // Cache
        setCache("collections", collectionId, collectionData);

        return collectionData;
    } catch (error) {
        console.error("[LearningCollectionService] Error getting collection:", error);
        throw error;
    }
}

/**
 * Get resources in a collection
 *
 * @param {string} collectionId - Collection ID
 * @param {Object} options - Query options (sortBy, limit)
 * @returns {Promise<Array>} Array of resources with metadata
 *
 * @example
 * const resources = await getCollectionResources("coll_001");
 * // [
 * //   { resourceId, title, order, addedDate },
 * //   ...
 * // ]
 */
export async function getCollectionResources(collectionId, options = {}) {
    try {
        // Check cache
        const cacheKey = `resources_${collectionId}`;
        if (cache.resources.has(cacheKey) && isValidCache("resources", cacheKey)) {
            return cache.resources.get(cacheKey);
        }

        const collection_ = await getCollectionById(collectionId);

        if (!collection_) {
            return [];
        }

        let resources = collection_.resources || [];

        // Sort
        if (options.sortBy === "order") {
            resources.sort((a, b) => (a.order || 0) - (b.order || 0));
        } else if (options.sortBy === "recent") {
            resources.sort((a, b) => b.addedDate - a.addedDate);
        }

        // Cache
        setCache("resources", cacheKey, resources);

        return resources.slice(0, options.limit || 100);
    } catch (error) {
        console.error("[LearningCollectionService] Error getting collection resources:", error);
        throw error;
    }
}

/**
 * Get collections for a student (personal + enrolled)
 *
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} Array of student's collections
 */
export async function getStudentCollections(studentId) {
    try {
        const cacheKey = `student_${studentId}`;

        // Check cache
        if (
            cache.collections_by_student.has(cacheKey) &&
            isValidCache("collections_by_student", cacheKey)
        ) {
            return cache.collections_by_student.get(cacheKey);
        }

        // Get personal collections
        const collRef = collection(db, "learning_collections");
        const q = query(collRef, where("createdBy", "==", studentId));
        const snapshot = await getDocs(q);

        const collections = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Cache
        setCache("collections_by_student", cacheKey, collections);

        return collections;
    } catch (error) {
        console.error("[LearningCollectionService] Error getting student collections:", error);
        throw error;
    }
}

/**
 * Create a new learning collection
 *
 * @param {string} studentId - Creator's student ID
 * @param {Object} collectionData - Collection metadata
 * @returns {Promise<string>} New collection ID
 *
 * @example
 * const collectionId = await createCollection("student_123", {
 *   title: "My AI Learning Path",
 *   description: "Resources for learning AI",
 *   type: "personal",
 *   isPublished: false
 * });
 */
export async function createCollection(studentId, collectionData) {
    try {
        const collRef = collection(db, "learning_collections");
        const newDoc = doc(collRef);

        const collection_ = {
            ...collectionData,
            id: newDoc.id,
            createdBy: studentId,
            resources: [],
            type: collectionData.type || "personal",
            isPublished: collectionData.isPublished || false,
            enrollments: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(newDoc, collection_);

        // Invalidate cache
        invalidateStudentCollectionsCache(studentId);

        console.log(`[LearningCollectionService] Created collection: ${newDoc.id}`);

        return newDoc.id;
    } catch (error) {
        console.error("[LearningCollectionService] Error creating collection:", error);
        throw error;
    }
}

/**
 * Update collection metadata
 *
 * @param {string} collectionId - Collection ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateCollection(collectionId, updates) {
    try {
        const collRef = doc(db, "learning_collections", collectionId);

        await updateDoc(collRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });

        // Invalidate cache
        invalidateCollectionCache(collectionId);

        console.log(`[LearningCollectionService] Updated collection: ${collectionId}`);
    } catch (error) {
        console.error("[LearningCollectionService] Error updating collection:", error);
        throw error;
    }
}

/**
 * Add resource to collection
 *
 * @param {string} collectionId - Collection ID
 * @param {Object} resource - Resource to add { resourceId, title, order }
 * @returns {Promise<void>}
 *
 * @example
 * await addResourceToCollection("coll_001", {
 *   resourceId: "res_001",
 *   title: "Python Basics",
 *   order: 1,
 *   addedDate: new Date()
 * });
 */
export async function addResourceToCollection(collectionId, resource) {
    try {
        const collRef = doc(db, "learning_collections", collectionId);

        await updateDoc(collRef, {
            resources: arrayUnion({
                ...resource,
                addedDate: resource.addedDate || serverTimestamp(),
            }),
            updatedAt: serverTimestamp(),
        });

        // Invalidate cache
        invalidateCollectionResourcesCache(collectionId);

        console.log(
            `[LearningCollectionService] Added resource to collection: ${collectionId}`
        );
    } catch (error) {
        console.error("[LearningCollectionService] Error adding resource:", error);
        throw error;
    }
}

/**
 * Remove resource from collection
 *
 * @param {string} collectionId - Collection ID
 * @param {string} resourceId - Resource ID to remove
 * @returns {Promise<void>}
 */
export async function removeResourceFromCollection(collectionId, resourceId) {
    try {
        const collection_ = await getCollectionById(collectionId);

        if (!collection_) {
            throw new Error("Collection not found");
        }

        // Find and remove the resource
        const resourceToRemove = collection_.resources.find(r => r.resourceId === resourceId);

        if (resourceToRemove) {
            const collRef = doc(db, "learning_collections", collectionId);

            await updateDoc(collRef, {
                resources: arrayRemove(resourceToRemove),
                updatedAt: serverTimestamp(),
            });

            // Invalidate cache
            invalidateCollectionResourcesCache(collectionId);

            console.log(
                `[LearningCollectionService] Removed resource from collection: ${collectionId}`
            );
        }
    } catch (error) {
        console.error("[LearningCollectionService] Error removing resource:", error);
        throw error;
    }
}

/**
 * Delete a collection
 *
 * @param {string} collectionId - Collection ID
 * @param {string} studentId - Student ID (for permissions)
 * @returns {Promise<void>}
 */
export async function deleteCollection(collectionId, studentId) {
    try {
        const collection_ = await getCollectionById(collectionId);

        if (!collection_) {
            throw new Error("Collection not found");
        }

        // Verify ownership
        if (collection_.createdBy !== studentId) {
            throw new Error("Only the creator can delete this collection");
        }

        await deleteDoc(doc(db, "learning_collections", collectionId));

        // Invalidate cache
        invalidateCollectionCache(collectionId);
        invalidateStudentCollectionsCache(studentId);

        console.log(`[LearningCollectionService] Deleted collection: ${collectionId}`);
    } catch (error) {
        console.error("[LearningCollectionService] Error deleting collection:", error);
        throw error;
    }
}

/**
 * Search collections
 *
 * @param {string} query - Search query (title, description)
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Matching collections
 */
export async function searchCollections(query, options = {}) {
    try {
        const collections = await getLearningCollections({ type: "curated" });

        const results = collections.filter(collection => {
            const searchText = `${collection.title} ${collection.description}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        // Sort by relevance (title match first)
        results.sort((a, b) => {
            const aTitle = a.title.toLowerCase();
            const bTitle = b.title.toLowerCase();
            const aMatch = aTitle.startsWith(query.toLowerCase()) ? 1 : 0;
            const bMatch = bTitle.startsWith(query.toLowerCase()) ? 1 : 0;
            return bMatch - aMatch;
        });

        return results.slice(0, options.limit || 20);
    } catch (error) {
        console.error("[LearningCollectionService] Error searching collections:", error);
        throw error;
    }
}

/**
 * Get popular collections
 *
 * @param {number} limit - Number of collections (default: 10)
 * @returns {Promise<Array>} Most popular collections
 */
export async function getPopularCollections(limit = 10) {
    try {
        const collections = await getLearningCollections();

        // Sort by enrollments
        collections.sort((a, b) => (b.enrollments || 0) - (a.enrollments || 0));

        return collections.slice(0, limit);
    } catch (error) {
        console.error("[LearningCollectionService] Error getting popular collections:", error);
        throw error;
    }
}

/**
 * Enroll student in collection
 *
 * @param {string} studentId - Student ID
 * @param {string} collectionId - Collection ID
 * @returns {Promise<void>}
 */
export async function enrollInCollection(studentId, collectionId) {
    try {
        const collRef = doc(db, "learning_collections", collectionId);

        // Increment enrollments
        const collection_ = await getCollectionById(collectionId);

        await updateDoc(collRef, {
            enrollments: (collection_.enrollments || 0) + 1,
            updatedAt: serverTimestamp(),
        });

        // Invalidate cache
        invalidateCollectionCache(collectionId);

        console.log(`[LearningCollectionService] Student enrolled in collection`);
    } catch (error) {
        console.error("[LearningCollectionService] Error enrolling in collection:", error);
        throw error;
    }
}

/**
 * Cache utility functions
 * @private
 */

function setCache(cacheType, key, value) {
    cache[cacheType].set(key, value);
    if (!cacheTimestamps[cacheType]) {
        cacheTimestamps[cacheType] = new Map();
    }
    cacheTimestamps[cacheType].set(key, Date.now());
}

function isValidCache(cacheType, key) {
    const timestamp = cacheTimestamps[cacheType]?.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_TTL;
}

function invalidateCollectionCache(collectionId) {
    cache.collections.delete(collectionId);
    cacheTimestamps.collections.delete(collectionId);
}

function invalidateCollectionResourcesCache(collectionId) {
    const cacheKey = `resources_${collectionId}`;
    cache.resources.delete(cacheKey);
    cacheTimestamps.resources.delete(cacheKey);
}

function invalidateStudentCollectionsCache(studentId) {
    const cacheKey = `student_${studentId}`;
    cache.collections_by_student.delete(cacheKey);
    cacheTimestamps.collections_by_student.delete(cacheKey);
}

/**
 * Clear all cache
 */
export function clearCollectionsCache() {
    cache = {
        collections: new Map(),
        collections_by_student: new Map(),
        resources: new Map(),
    };
    cacheTimestamps = {
        collections: new Map(),
        collections_by_student: new Map(),
        resources: new Map(),
    };
    console.log("[LearningCollectionService] Cache cleared");
}

export default {
    getLearningCollections,
    getCollectionById,
    getCollectionResources,
    getStudentCollections,
    createCollection,
    updateCollection,
    addResourceToCollection,
    removeResourceFromCollection,
    deleteCollection,
    searchCollections,
    getPopularCollections,
    enrollInCollection,
    clearCollectionsCache,
};
