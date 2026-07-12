/**
 * ============================================================
 * Sword Institute LMS
 * Knowledge Hub Resource Service
 * Version: 1.0.0
 * ============================================================
 *
 * This service is the ONLY place that communicates with the
 * Firestore "knowledge_resources" collection.
 *
 * Knowledge Hub pages, Dashboard, Courses, Academies, and
 * Professor SWORD should NEVER query Firestore directly.
 *
 * All requests are routed through this service for:
 * - Caching and performance
 * - Consistent data normalization
 * - Search and filtering
 * - Authorization checks
 *
 * ============================================================
 */

import {
    db,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getDoc,
    doc,
    startAfter,
    startAt,
} from "../firebase.js";

import {
    normalizeResource,
    normalizeResources,
} from "../utils/resourceNormalizer.js";

/* ============================================================
   CONSTANTS
============================================================ */

const RESOURCE_COLLECTION = "knowledge_resources";
const CACHE_TIME = 1000 * 60 * 5; // 5 minutes

/* ============================================================
   CACHE STATE
============================================================ */

let resourceCache = [];
let lastLoaded = null;
let resourcesById = {}; // Fast lookup by ID

/* ============================================================
   CACHE HELPERS
============================================================ */

function cacheValid() {
    if (!lastLoaded) return false;
    return Date.now() - lastLoaded < CACHE_TIME;
}

function updateCache(resources) {
    resourceCache = normalizeResources(resources);
    resourcesById = {};
    resourceCache.forEach(r => {
        resourcesById[r.resourceId] = r;
    });
    lastLoaded = Date.now();
}

/* ============================================================
   COLLECTION REFERENCE
============================================================ */

function resourcesRef() {
    return collection(db, RESOURCE_COLLECTION);
}

/* ============================================================
   LOAD ALL RESOURCES
============================================================ */

/**
 * Load all published resources with caching
 * @param {boolean} forceRefresh - Bypass cache
 * @returns {Promise<Array>} Normalized resource array
 */
async function loadResources(forceRefresh = false) {
    if (!forceRefresh && cacheValid()) {
        console.log("⚡ Using cached resources");
        return resourceCache;
    }

    try {
        console.log("📚 Loading resources from Firestore...");
        
        const q = query(
            resourcesRef(),
            where("isPublished", "==", true),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const resources = snapshot.docs.map(doc => ({
            ...doc.data(),
            resourceId: doc.id,
        }));

        updateCache(resources);
        console.log(`✅ Loaded ${resources.length} resources`);
        
        return resourceCache;
    } catch (error) {
        console.error("❌ Error loading resources:", error);
        throw error;
    }
}

/* ============================================================
   GET SINGLE RESOURCE
============================================================ */

/**
 * Get a single resource by ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<Object>} Normalized resource
 */
async function getResourceById(resourceId) {
    try {
        // Check cache first
        if (resourcesById[resourceId]) {
            console.log(`⚡ Cache hit: ${resourceId}`);
            return resourcesById[resourceId];
        }

        // Fetch from Firestore
        const docRef = doc(db, RESOURCE_COLLECTION, resourceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error(`Resource not found: ${resourceId}`);
        }

        const resource = normalizeResource({
            ...docSnap.data(),
            resourceId: docSnap.id,
        });

        // Cache it
        resourcesById[resourceId] = resource;

        return resource;
    } catch (error) {
        console.error(`❌ Error loading resource ${resourceId}:`, error);
        throw error;
    }
}

/* ============================================================
   SEARCH & FILTER
============================================================ */

/**
 * Search resources with filters
 * @param {Object} filters - Filter criteria
 * @param {string} filters.query - Search query (client-side)
 * @param {string} filters.academy - Academy ID
 * @param {string} filters.type - Resource type
 * @param {string} filters.difficulty - Difficulty level
 * @param {number} filters.minRating - Minimum rating
 * @param {string} filters.sortBy - Sort field: createdAt | rating | views
 * @param {number} filters.pageSize - Results per page (default 20)
 * @returns {Promise<Array>} Filtered, normalized resources
 */
async function searchResources(filters = {}) {
    try {
        let resources = await loadResources();

        // Filter by academy
        if (filters.academy) {
            resources = resources.filter(r => r.academy === filters.academy);
        }

        // Filter by type
        if (filters.type) {
            resources = resources.filter(r => r.type === filters.type);
        }

        // Filter by difficulty
        if (filters.difficulty) {
            resources = resources.filter(r => r.difficulty === filters.difficulty);
        }

        // Filter by minimum rating
        if (filters.minRating) {
            resources = resources.filter(r => (r.rating || 0) >= filters.minRating);
        }

        // Client-side text search on title and description
        if (filters.query) {
            const q = filters.query.toLowerCase();
            resources = resources.filter(r =>
                r.title.toLowerCase().includes(q) ||
                r.shortDescription.toLowerCase().includes(q) ||
                (r.tags || []).some(tag => tag.toLowerCase().includes(q))
            );
        }

        // Sort
        const sortBy = filters.sortBy || "createdAt";
        if (sortBy === "rating") {
            resources.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortBy === "views") {
            resources.sort((a, b) => (b.views || 0) - (a.views || 0));
        } else {
            // createdAt (default, already sorted from Firestore)
        }

        // Pagination
        const pageSize = filters.pageSize || 20;
        resources = resources.slice(0, pageSize);

        console.log(`✅ Search found ${resources.length} resources`);
        return resources;
    } catch (error) {
        console.error("❌ Error searching resources:", error);
        throw error;
    }
}

/* ============================================================
   FILTERED QUERIES
============================================================ */

/**
 * Get resources by academy
 * @param {string} academyId - Academy ID
 * @returns {Promise<Array>} Resources for academy
 */
async function getResourcesByAcademy(academyId) {
    try {
        const resources = await loadResources();
        return resources.filter(r => r.academy === academyId);
    } catch (error) {
        console.error(`❌ Error loading resources for academy ${academyId}:`, error);
        throw error;
    }
}

/**
 * Get resources by type
 * @param {string} type - Resource type
 * @returns {Promise<Array>} Resources of type
 */
async function getResourcesByType(type) {
    try {
        const resources = await loadResources();
        return resources.filter(r => r.type === type);
    } catch (error) {
        console.error(`❌ Error loading resources of type ${type}:`, error);
        throw error;
    }
}

/**
 * Get resources by difficulty level
 * @param {string} difficulty - Difficulty level
 * @returns {Promise<Array>} Resources at difficulty
 */
async function getResourcesByDifficulty(difficulty) {
    try {
        const resources = await loadResources();
        return resources.filter(r => r.difficulty === difficulty);
    } catch (error) {
        console.error(`❌ Error loading resources at difficulty ${difficulty}:`, error);
        throw error;
    }
}

/**
 * Get resources with tags
 * @param {string} tag - Tag to search
 * @returns {Promise<Array>} Resources with tag
 */
async function getResourcesByTag(tag) {
    try {
        const resources = await loadResources();
        return resources.filter(r =>
            (r.tags || []).some(t => t.toLowerCase() === tag.toLowerCase())
        );
    } catch (error) {
        console.error(`❌ Error loading resources with tag ${tag}:`, error);
        throw error;
    }
}

/* ============================================================
   POPULAR & TRENDING
============================================================ */

/**
 * Get top-rated resources
 * @param {number} limit - Max results (default 10)
 * @returns {Promise<Array>} Top-rated resources
 */
async function getPopularResources(limit = 10) {
    try {
        let resources = await loadResources();
        resources = resources
            .filter(r => r.ratingCount > 0) // Only rated
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, limit);
        return resources;
    } catch (error) {
        console.error("❌ Error loading popular resources:", error);
        throw error;
    }
}

/**
 * Get most-viewed resources
 * @param {number} limit - Max results (default 10)
 * @returns {Promise<Array>} Most-viewed resources
 */
async function getTrendingResources(limit = 10) {
    try {
        let resources = await loadResources();
        resources = resources
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, limit);
        return resources;
    } catch (error) {
        console.error("❌ Error loading trending resources:", error);
        throw error;
    }
}

/**
 * Get newest resources
 * @param {number} limit - Max results (default 10)
 * @returns {Promise<Array>} Newest resources
 */
async function getNewestResources(limit = 10) {
    try {
        let resources = await loadResources();
        return resources.slice(0, limit);
    } catch (error) {
        console.error("❌ Error loading newest resources:", error);
        throw error;
    }
}

/* ============================================================
   RESOURCE STATS
============================================================ */

/**
 * Get resource statistics
 * @returns {Promise<Object>} Stats object
 */
async function getResourceStats() {
    try {
        const resources = await loadResources();
        
        const stats = {
            totalResources: resources.length,
            byType: {},
            byDifficulty: {},
            averageRating: 0,
            totalViews: 0,
            totalDownloads: 0,
        };

        let totalRating = 0;
        let ratedCount = 0;

        resources.forEach(r => {
            // Count by type
            stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;

            // Count by difficulty
            stats.byDifficulty[r.difficulty] = (stats.byDifficulty[r.difficulty] || 0) + 1;

            // Aggregate stats
            if (r.rating) {
                totalRating += r.rating;
                ratedCount += 1;
            }
            stats.totalViews += r.views || 0;
            stats.totalDownloads += r.downloads || 0;
        });

        stats.averageRating = ratedCount > 0 ? totalRating / ratedCount : 0;

        return stats;
    } catch (error) {
        console.error("❌ Error computing resource stats:", error);
        throw error;
    }
}

/* ============================================================
   CACHE MANAGEMENT
============================================================ */

/**
 * Clear cache and force refresh on next load
 */
function clearCache() {
    resourceCache = [];
    resourcesById = {};
    lastLoaded = null;
    console.log("🔄 Resource cache cleared");
}

/**
 * Get cache status
 * @returns {Object} Cache info
 */
function getCacheStatus() {
    return {
        cacheValid: cacheValid(),
        resourcesInCache: resourceCache.length,
        lastLoaded: lastLoaded ? new Date(lastLoaded).toLocaleTimeString() : "Never",
        cacheAge: lastLoaded ? Date.now() - lastLoaded : null,
    };
}

/* ============================================================
   ADMIN FUNCTIONS (Create/Update/Delete)
============================================================ */

/**
 * Create a new resource (Admin only)
 * @param {Object} data - Resource data
 * @returns {Promise<string>} New resource ID
 */
async function createResource(data) {
    try {
        console.log("➕ Creating new resource...");
        // TODO: Implement when Cloud Functions are ready
        // This should create via Cloud Function for security
        throw new Error("Create resource not yet implemented");
    } catch (error) {
        console.error("❌ Error creating resource:", error);
        throw error;
    }
}

/**
 * Update a resource (Admin only)
 * @param {string} resourceId - Resource ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
async function updateResource(resourceId, updates) {
    try {
        console.log(`✏️ Updating resource ${resourceId}...`);
        // TODO: Implement when Cloud Functions are ready
        clearCache(); // Invalidate cache after update
    } catch (error) {
        console.error("❌ Error updating resource:", error);
        throw error;
    }
}

/**
 * Delete a resource (Admin only)
 * @param {string} resourceId - Resource ID
 * @returns {Promise<void>}
 */
async function deleteResource(resourceId) {
    try {
        console.log(`🗑️ Deleting resource ${resourceId}...`);
        // TODO: Implement when Cloud Functions are ready
        clearCache(); // Invalidate cache after delete
    } catch (error) {
        console.error("❌ Error deleting resource:", error);
        throw error;
    }
}

/* ============================================================
   EXPORTS
============================================================ */

export {
    loadResources,
    getResourceById,
    searchResources,
    getResourcesByAcademy,
    getResourcesByType,
    getResourcesByDifficulty,
    getResourcesByTag,
    getPopularResources,
    getTrendingResources,
    getNewestResources,
    getResourceStats,
    clearCache,
    getCacheStatus,
    createResource,
    updateResource,
    deleteResource,
};

export default {
    loadResources,
    getResourceById,
    searchResources,
    getResourcesByAcademy,
    getResourcesByType,
    getResourcesByDifficulty,
    getResourcesByTag,
    getPopularResources,
    getTrendingResources,
    getNewestResources,
    getResourceStats,
    clearCache,
    getCacheStatus,
};
