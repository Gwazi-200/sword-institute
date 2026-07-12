/**
 * ============================================================
 * Sword Institute LMS
 * Reading Path Service
 * Version: 1.0.0
 * ============================================================
 *
 * Manages guided learning journeys/paths for structured learning.
 *
 * Features:
 * - Pre-designed learning paths
 * - Sequential resource ordering
 * - Progress tracking through paths
 * - Milestone checkpoints
 * - Estimated completion time
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
    serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";

// Cache configuration
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let cache = {
    paths: new Map(),
    progress: new Map(),
};
let cacheTimestamps = {
    paths: new Map(),
    progress: new Map(),
};

/**
 * Get all reading paths
 *
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of path objects
 *
 * @example
 * const paths = await getReadingPaths({
 *   difficulty: "beginner",
 *   limit: 10
 * });
 */
export async function getReadingPaths(options = {}) {
    try {
        const cacheKey = `all_${options.difficulty || "all"}`;

        // Check cache
        if (cache.paths.has(cacheKey) && isValidCache("paths", cacheKey)) {
            return cache.paths.get(cacheKey);
        }

        const pathRef = collection(db, "reading_paths");
        let q = pathRef;

        if (options.difficulty) {
            q = query(pathRef, where("difficulty", "==", options.difficulty));
        }

        const snapshot = await getDocs(q);
        const paths = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Sort by creation date (newest first)
        paths.sort((a, b) => b.createdAt - a.createdAt);

        // Cache
        setCache("paths", cacheKey, paths);

        return paths.slice(0, options.limit || 50);
    } catch (error) {
        console.error("[ReadingPathService] Error getting paths:", error);
        throw error;
    }
}

/**
 * Get path by ID
 *
 * @param {string} pathId - Path ID
 * @returns {Promise<Object|null>} Path object or null if not found
 *
 * @example
 * const path = await getPathById("path_001");
 * console.log(path.title);
 * // "AI Fundamentals"
 */
export async function getPathById(pathId) {
    try {
        // Check cache
        if (cache.paths.has(pathId) && isValidCache("paths", pathId)) {
            return cache.paths.get(pathId);
        }

        const docSnapshot = await getDoc(doc(db, "reading_paths", pathId));

        if (!docSnapshot.exists()) {
            return null;
        }

        const pathData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
        };

        // Cache
        setCache("paths", pathId, pathData);

        return pathData;
    } catch (error) {
        console.error("[ReadingPathService] Error getting path:", error);
        throw error;
    }
}

/**
 * Get resources in a reading path
 *
 * @param {string} pathId - Path ID
 * @returns {Promise<Array>} Array of resources with order
 *
 * @example
 * const resources = await getPathResources("path_001");
 * // [
 * //   { resourceId, title, order, estimatedTime, required },
 * //   ...
 * // ]
 */
export async function getPathResources(pathId) {
    try {
        const path = await getPathById(pathId);

        if (!path) {
            return [];
        }

        // Sort by order
        const resources = (path.resources || []).sort((a, b) => (a.order || 0) - (b.order || 0));

        return resources;
    } catch (error) {
        console.error("[ReadingPathService] Error getting path resources:", error);
        throw error;
    }
}

/**
 * Enroll student in reading path
 *
 * @param {string} studentId - Student ID
 * @param {string} pathId - Path ID
 * @returns {Promise<string>} Enrollment ID
 *
 * @example
 * const enrollmentId = await enrollInPath("student_123", "path_001");
 */
export async function enrollInPath(studentId, pathId) {
    try {
        const path = await getPathById(pathId);

        if (!path) {
            throw new Error("Path not found");
        }

        // Create enrollment document
        const enrollmentRef = collection(db, `reading_paths/${pathId}/enrollments`);
        const newEnrollment = doc(enrollmentRef);

        const enrollment = {
            studentId,
            pathId,
            enrolledDate: serverTimestamp(),
            progress: 0,
            completedResources: [],
            milestones: [],
            status: "active",
        };

        await setDoc(newEnrollment, enrollment);

        console.log(`[ReadingPathService] Student enrolled in path: ${pathId}`);

        return newEnrollment.id;
    } catch (error) {
        console.error("[ReadingPathService] Error enrolling in path:", error);
        throw error;
    }
}

/**
 * Get student's progress in a path
 *
 * @param {string} studentId - Student ID
 * @param {string} pathId - Path ID
 * @returns {Promise<Object|null>} Progress object or null if not enrolled
 *
 * @example
 * const progress = await getPathProgress("student_123", "path_001");
 * console.log(progress);
 * // {
 * //   progress: 45,
 * //   completedResources: [...],
 * //   milestones: [...],
 * //   estimatedCompletion: Date,
 * //   status: "active"
 * // }
 */
export async function getPathProgress(studentId, pathId) {
    try {
        const cacheKey = `${studentId}:${pathId}`;

        // Check cache
        if (cache.progress.has(cacheKey) && isValidCache("progress", cacheKey)) {
            return cache.progress.get(cacheKey);
        }

        const enrollmentsRef = collection(db, `reading_paths/${pathId}/enrollments`);
        const q = query(enrollmentsRef, where("studentId", "==", studentId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const progressData = snapshot.docs[0].data();

        // Calculate estimated completion
        const path = await getPathById(pathId);
        const totalTime = path.estimatedTime || 0;
        const currentProgress = progressData.progress || 0;
        const remainingTime = totalTime * ((100 - currentProgress) / 100);

        const progress = {
            ...progressData,
            estimatedCompletion: new Date(Date.now() + remainingTime * 60 * 60 * 1000),
        };

        // Cache
        setCache("progress", cacheKey, progress);

        return progress;
    } catch (error) {
        console.error("[ReadingPathService] Error getting path progress:", error);
        throw error;
    }
}

/**
 * Update student progress in path
 *
 * @param {string} studentId - Student ID
 * @param {string} pathId - Path ID
 * @param {Object} updates - Progress updates
 * @returns {Promise<void>}
 *
 * @example
 * await updatePathProgress("student_123", "path_001", {
 *   progress: 50,
 *   completedResources: ["res_001", "res_002"]
 * });
 */
export async function updatePathProgress(studentId, pathId, updates) {
    try {
        const enrollmentsRef = collection(db, `reading_paths/${pathId}/enrollments`);
        const q = query(enrollmentsRef, where("studentId", "==", studentId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error("Student not enrolled in this path");
        }

        const enrollmentId = snapshot.docs[0].id;
        const enrollmentRef = doc(db, `reading_paths/${pathId}/enrollments`, enrollmentId);

        await updateDoc(enrollmentRef, {
            ...updates,
            lastUpdated: serverTimestamp(),
        });

        // Invalidate cache
        invalidateProgressCache(studentId, pathId);

        // Check for milestone completion
        await checkAndAwardMilestones(studentId, pathId);

        console.log(`[ReadingPathService] Updated progress for student in path`);
    } catch (error) {
        console.error("[ReadingPathService] Error updating progress:", error);
        throw error;
    }
}

/**
 * Complete a resource in path
 *
 * @param {string} studentId - Student ID
 * @param {string} pathId - Path ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<void>}
 */
export async function completePathResource(studentId, pathId, resourceId) {
    try {
        const progress = await getPathProgress(studentId, pathId);

        if (!progress) {
            throw new Error("Student not enrolled in this path");
        }

        const path = await getPathById(pathId);
        const resources = path.resources || [];

        // Find resource index
        const resourceIndex = resources.findIndex(r => r.resourceId === resourceId);
        if (resourceIndex === -1) {
            throw new Error("Resource not found in path");
        }

        // Update completed resources
        const completedResources = progress.completedResources || [];
        if (!completedResources.includes(resourceId)) {
            completedResources.push(resourceId);
        }

        // Calculate progress percentage
        const progressPercent = Math.round((completedResources.length / resources.length) * 100);

        // Determine if path is complete
        const isComplete = progressPercent === 100;

        await updatePathProgress(studentId, pathId, {
            progress: progressPercent,
            completedResources,
            status: isComplete ? "completed" : "active",
            completedDate: isComplete ? serverTimestamp() : null,
        });

        console.log(`[ReadingPathService] Completed resource in path`);
    } catch (error) {
        console.error("[ReadingPathService] Error completing resource:", error);
        throw error;
    }
}

/**
 * Get next resource in path
 *
 * @param {string} studentId - Student ID
 * @param {string} pathId - Path ID
 * @returns {Promise<Object|null>} Next resource or null if path complete
 */
export async function getNextResource(studentId, pathId) {
    try {
        const progress = await getPathProgress(studentId, pathId);
        if (!progress) return null;

        const resources = await getPathResources(pathId);
        const completed = progress.completedResources || [];

        // Find first uncompleted required resource
        const nextResource = resources.find(
            r => !completed.includes(r.resourceId) && (r.required !== false)
        );

        return nextResource || null;
    } catch (error) {
        console.error("[ReadingPathService] Error getting next resource:", error);
        throw error;
    }
}

/**
 * Get featured paths
 *
 * @param {number} limit - Number of paths (default: 6)
 * @returns {Promise<Array>} Featured paths
 */
export async function getFeaturedPaths(limit = 6) {
    try {
        const paths = await getReadingPaths();

        // Sort by popularity/enrollments
        paths.sort((a, b) => (b.enrollments || 0) - (a.enrollments || 0));

        return paths.slice(0, limit);
    } catch (error) {
        console.error("[ReadingPathService] Error getting featured paths:", error);
        throw error;
    }
}

/**
 * Get paths by difficulty
 *
 * @param {string} difficulty - Difficulty level
 * @returns {Promise<Array>} Paths matching difficulty
 */
export async function getPathsByDifficulty(difficulty) {
    try {
        return await getReadingPaths({ difficulty });
    } catch (error) {
        console.error("[ReadingPathService] Error getting paths by difficulty:", error);
        throw error;
    }
}

/**
 * Check and award path completion milestone
 * @private
 */
async function checkAndAwardMilestones(studentId, pathId) {
    try {
        const progress = await getPathProgress(studentId, pathId);

        if (!progress) return;

        const milestones = progress.milestones || [];

        // Milestone definitions
        const possibleMilestones = [
            { threshold: 25, name: "Quarter Way", icon: "🎯" },
            { threshold: 50, name: "Halfway", icon: "🌟" },
            { threshold: 75, name: "Almost There", icon: "🔥" },
            { threshold: 100, name: "Path Complete", icon: "🏆" },
        ];

        // Check for new milestones
        for (const milestone of possibleMilestones) {
            if (
                progress.progress >= milestone.threshold &&
                !milestones.find(m => m.threshold === milestone.threshold)
            ) {
                milestones.push({
                    ...milestone,
                    achievedDate: new Date(),
                });

                // Update progress with new milestone
                await updatePathProgress(studentId, pathId, {
                    milestones,
                });
            }
        }
    } catch (error) {
        console.error("[ReadingPathService] Error checking milestones:", error);
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

function invalidateProgressCache(studentId, pathId) {
    const cacheKey = `${studentId}:${pathId}`;
    cache.progress.delete(cacheKey);
    cacheTimestamps.progress.delete(cacheKey);
}

/**
 * Clear all cache
 */
export function clearPathsCache() {
    cache = {
        paths: new Map(),
        progress: new Map(),
    };
    cacheTimestamps = {
        paths: new Map(),
        progress: new Map(),
    };
    console.log("[ReadingPathService] Cache cleared");
}

export default {
    getReadingPaths,
    getPathById,
    getPathResources,
    enrollInPath,
    getPathProgress,
    updatePathProgress,
    completePathResource,
    getNextResource,
    getFeaturedPaths,
    getPathsByDifficulty,
    clearPathsCache,
};
