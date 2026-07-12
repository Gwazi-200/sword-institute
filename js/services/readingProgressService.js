/**
 * ============================================================
 * Sword Institute LMS
 * Reading Progress Service
 * Version: 1.0.0
 * ============================================================
 *
 * This service tracks learner reading activity and progress.
 *
 * Manages:
 * - Reading status (not-started, in-progress, completed)
 * - Progress percentage
 * - Time spent tracking
 * - Notes and highlights count
 * - Reading history and streaks
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
    setDoc,
    updateDoc,
    deleteDoc,
    deleteField,
    Timestamp,
} from "../firebase.js";

/* ============================================================
   CONSTANTS
============================================================ */

const PROGRESS_COLLECTION = "reading_progress";

/* ============================================================
   COLLECTION REFERENCE
============================================================ */

function progressRef(studentId) {
    return collection(db, PROGRESS_COLLECTION, studentId, "resources");
}

/* ============================================================
   PROGRESS TRACKING
============================================================ */

/**
 * Start reading a resource (or resume)
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
async function startReading(studentId, resourceId, options = {}) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);
        const docSnap = await getDoc(docRef);

        const existingData = docSnap.exists() ? docSnap.data() : {};

        const progressData = {
            studentId,
            resourceId,
            status: "in-progress",
            progress: options.progress || existingData.progress || 0,
            currentPage: options.currentPage || existingData.currentPage || 0,
            notesCount: existingData.notesCount || 0,
            highlightCount: existingData.highlightCount || 0,
            isSaved: existingData.isSaved || false,
            isLiked: existingData.isLiked || false,
            lastAccessedAt: Timestamp.now(),
            createdAt: existingData.createdAt || Timestamp.now(),
            timeSpent: existingData.timeSpent || 0,
            sessionCount: (existingData.sessionCount || 0) + 1,
        };

        await setDoc(docRef, progressData, { merge: true });
        console.log(`✅ Started reading: ${studentId} → ${resourceId}`);
    } catch (error) {
        console.error("❌ Error starting reading:", error);
        throw error;
    }
}

/**
 * Update reading progress
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @param {Object} updates - Fields to update
 *   - progress: 0-100 percentage
 *   - currentPage: Current page number
 *   - timeSpent: Additional seconds to add
 * @returns {Promise<void>}
 */
async function updateProgress(studentId, resourceId, updates) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);

        const updateData = {
            lastAccessedAt: Timestamp.now(),
        };

        if (updates.progress !== undefined) {
            updateData.progress = Math.min(100, Math.max(0, updates.progress));
        }

        if (updates.currentPage !== undefined) {
            updateData.currentPage = updates.currentPage;
        }

        if (updates.timeSpent !== undefined) {
            // Get current time spent and add to it
            const docSnap = await getDoc(docRef);
            const current = docSnap.exists() ? docSnap.data().timeSpent || 0 : 0;
            updateData.timeSpent = current + updates.timeSpent;
        }

        // If progress reached 95%+, mark as completed
        if (updateData.progress >= 95) {
            updateData.status = "completed";
            updateData.completedAt = Timestamp.now();
        } else if (updateData.progress > 0) {
            updateData.status = "in-progress";
        }

        await updateDoc(docRef, updateData);
        console.log(`✅ Updated progress: ${studentId} → ${resourceId}`);
    } catch (error) {
        console.error("❌ Error updating progress:", error);
        throw error;
    }
}

/**
 * Mark resource as completed
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<void>}
 */
async function markCompleted(studentId, resourceId) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);

        await updateDoc(docRef, {
            status: "completed",
            progress: 100,
            completedAt: Timestamp.now(),
            lastAccessedAt: Timestamp.now(),
        });

        console.log(`✅ Marked completed: ${studentId} → ${resourceId}`);
    } catch (error) {
        console.error("❌ Error marking completed:", error);
        throw error;
    }
}

/**
 * Reset reading progress (start over)
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<void>}
 */
async function resetProgress(studentId, resourceId) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);

        await updateDoc(docRef, {
            status: "not-started",
            progress: 0,
            currentPage: 0,
            timeSpent: 0,
            sessionCount: 0,
            completedAt: deleteField(),
        });

        console.log(`✅ Reset progress: ${studentId} → ${resourceId}`);
    } catch (error) {
        console.error("❌ Error resetting progress:", error);
        throw error;
    }
}

/* ============================================================
   GET PROGRESS
============================================================ */

/**
 * Get progress for one resource
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<Object>} Progress document
 */
async function getProgress(studentId, resourceId) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return {
            ...docSnap.data(),
            resourceId: docSnap.id,
        };
    } catch (error) {
        console.error("❌ Error getting progress:", error);
        throw error;
    }
}

/**
 * Get all resources in progress
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} In-progress resources
 */
async function getInProgressResources(studentId) {
    try {
        const q = query(
            progressRef(studentId),
            where("status", "==", "in-progress"),
            orderBy("lastAccessedAt", "desc"),
            limit(10)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            resourceId: doc.id,
        }));
    } catch (error) {
        console.error("❌ Error getting in-progress resources:", error);
        throw error;
    }
}

/**
 * Get continue reading list (most recent)
 * @param {string} studentId - Student ID
 * @param {number} limit - Max items (default 5)
 * @returns {Promise<Array>} Recently accessed resources
 */
async function getContinueReading(studentId, limit = 5) {
    try {
        const q = query(
            progressRef(studentId),
            where("status", "==", "in-progress"),
            orderBy("lastAccessedAt", "desc"),
            limit(limit)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            resourceId: doc.id,
        }));
    } catch (error) {
        console.error("❌ Error getting continue reading list:", error);
        throw error;
    }
}

/**
 * Get completed resources
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} Completed resources
 */
async function getCompletedResources(studentId) {
    try {
        const q = query(
            progressRef(studentId),
            where("status", "==", "completed"),
            orderBy("completedAt", "desc")
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            resourceId: doc.id,
        }));
    } catch (error) {
        console.error("❌ Error getting completed resources:", error);
        throw error;
    }
}

/**
 * Get reading history (all accessed)
 * @param {string} studentId - Student ID
 * @param {number} limit - Max items (default 20)
 * @returns {Promise<Array>} Resources ordered by last access
 */
async function getReadingHistory(studentId, limit = 20) {
    try {
        const q = query(
            progressRef(studentId),
            orderBy("lastAccessedAt", "desc"),
            limit: limit
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            resourceId: doc.id,
        }));
    } catch (error) {
        console.error("❌ Error getting reading history:", error);
        throw error;
    }
}

/* ============================================================
   STATISTICS
============================================================ */

/**
 * Get reading statistics for student
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Stats object
 */
async function getReadingStats(studentId) {
    try {
        const q = query(progressRef(studentId));
        const snapshot = await getDocs(q);

        let stats = {
            totalResourcesStarted: 0,
            totalResourcesCompleted: 0,
            totalTimeSpent: 0, // seconds
            averageProgress: 0,
            currentStreak: 0,
        };

        let totalProgress = 0;

        snapshot.docs.forEach(doc => {
            const data = doc.data();

            stats.totalResourcesStarted += 1;

            if (data.status === "completed") {
                stats.totalResourcesCompleted += 1;
            }

            stats.totalTimeSpent += data.timeSpent || 0;
            totalProgress += data.progress || 0;
        });

        if (snapshot.size > 0) {
            stats.averageProgress = totalProgress / snapshot.size;
        }

        console.log(`✅ Got stats for ${studentId}:`, stats);
        return stats;
    } catch (error) {
        console.error("❌ Error getting reading stats:", error);
        throw error;
    }
}

/**
 * Calculate reading streak
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Streak info
 */
async function getReadingStreak(studentId) {
    try {
        const q = query(progressRef(studentId), orderBy("lastAccessedAt", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.size === 0) {
            return { currentStreak: 0, longestStreak: 0, lastReadDate: null };
        }

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate = null;

        const docs = snapshot.docs.map(d => ({
            ...d.data(),
            resourceId: d.id,
        }));

        // Group by day
        const dayMap = new Map();
        docs.forEach(doc => {
            const date = new Date(doc.lastAccessedAt.toDate());
            const dateStr = date.toDateString();

            if (!dayMap.has(dateStr)) {
                dayMap.set(dateStr, true);
            }
        });

        // Calculate streaks
        const sortedDates = Array.from(dayMap.keys())
            .map(d => new Date(d))
            .sort((a, b) => b - a); // Newest first

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let checkDate = new Date(today);

        for (const date of sortedDates) {
            const diff = Math.floor((checkDate - date) / (1000 * 60 * 60 * 24));

            if (diff === 0 || diff === 1) {
                tempStreak++;
                checkDate = new Date(date);
            } else {
                break;
            }
        }

        currentStreak = tempStreak;
        lastReadDate = sortedDates[0] || null;

        console.log(`✅ Streak for ${studentId}: ${currentStreak} days`);

        return {
            currentStreak,
            longestStreak: currentStreak, // TODO: Track in separate doc
            lastReadDate,
        };
    } catch (error) {
        console.error("❌ Error calculating streak:", error);
        throw error;
    }
}

/* ============================================================
   NOTES & HIGHLIGHTS TRACKING
============================================================ */

/**
 * Increment notes count
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<void>}
 */
async function incrementNotesCount(studentId, resourceId) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);
        const docSnap = await getDoc(docRef);

        const current = docSnap.exists() ? docSnap.data().notesCount || 0 : 0;

        await updateDoc(docRef, {
            notesCount: current + 1,
        });
    } catch (error) {
        console.error("❌ Error incrementing notes count:", error);
        throw error;
    }
}

/**
 * Increment highlights count
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<void>}
 */
async function incrementHighlightsCount(studentId, resourceId) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);
        const docSnap = await getDoc(docRef);

        const current = docSnap.exists() ? docSnap.data().highlightCount || 0 : 0;

        await updateDoc(docRef, {
            highlightCount: current + 1,
        });
    } catch (error) {
        console.error("❌ Error incrementing highlights count:", error);
        throw error;
    }
}

/* ============================================================
   SAVED/LIKED TRACKING
============================================================ */

/**
 * Set saved status
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @param {boolean} isSaved - Saved?
 * @returns {Promise<void>}
 */
async function setSaved(studentId, resourceId, isSaved) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);
        await updateDoc(docRef, { isSaved });
        console.log(`✅ Saved: ${studentId} → ${resourceId} = ${isSaved}`);
    } catch (error) {
        console.error("❌ Error setting saved status:", error);
        throw error;
    }
}

/**
 * Set liked status
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @param {boolean} isLiked - Liked?
 * @returns {Promise<void>}
 */
async function setLiked(studentId, resourceId, isLiked) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);
        await updateDoc(docRef, { isLiked });
        console.log(`✅ Liked: ${studentId} → ${resourceId} = ${isLiked}`);
    } catch (error) {
        console.error("❌ Error setting liked status:", error);
        throw error;
    }
}

/* ============================================================
   EXPORTS
============================================================ */

export {
    startReading,
    updateProgress,
    markCompleted,
    resetProgress,
    getProgress,
    getInProgressResources,
    getContinueReading,
    getCompletedResources,
    getReadingHistory,
    getReadingStats,
    getReadingStreak,
    incrementNotesCount,
    incrementHighlightsCount,
    setSaved,
    setLiked,
};

export default {
    startReading,
    updateProgress,
    markCompleted,
    resetProgress,
    getProgress,
    getInProgressResources,
    getContinueReading,
    getCompletedResources,
    getReadingHistory,
    getReadingStats,
    getReadingStreak,
    incrementNotesCount,
    incrementHighlightsCount,
    setSaved,
    setLiked,
};
