/**
 * ============================================================
 * Sword Institute LMS
 * Bookmark Service
 * Version: 1.0.0
 * ============================================================
 *
 * This service manages saved and liked resources for learners.
 *
 * Features:
 * - Save resources to "My Bookshelf"
 * - Like/unlike resources (appreciation/rating)
 * - Get all saved resources
 * - Get all liked resources
 * - Check if resource is saved/liked
 *
 * Note: Internally uses reading_progress collection
 * with isSaved and isLiked flags.
 *
 * ============================================================
 */

import {
    db,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    updateDoc,
    getDoc,
    Timestamp,
} from "../firebase.js";

import { startReading } from "./readingProgressService.js";

/* ============================================================
   CONSTANTS
============================================================ */

const PROGRESS_COLLECTION = "reading_progress";

/* ============================================================
   SAVE RESOURCE
============================================================ */

/**
 * Save/bookmark a resource
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<void>}
 */
async function saveResource(studentId, resourceId) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Create progress entry if doesn't exist
            await startReading(studentId, resourceId);
        }

        await updateDoc(docRef, {
            isSaved: true,
            lastAccessedAt: Timestamp.now(),
        });

        console.log(`✅ Saved resource: ${studentId} → ${resourceId}`);
    } catch (error) {
        console.error("❌ Error saving resource:", error);
        throw error;
    }
}

/**
 * Unsave/unbookmark a resource
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<void>}
 */
async function unsaveResource(studentId, resourceId) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);

        await updateDoc(docRef, {
            isSaved: false,
        });

        console.log(`✅ Unsaved resource: ${studentId} → ${resourceId}`);
    } catch (error) {
        console.error("❌ Error unsaving resource:", error);
        throw error;
    }
}

/**
 * Check if resource is saved
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<boolean>} Is saved?
 */
async function isSaved(studentId, resourceId) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return false;
        }

        return docSnap.data().isSaved || false;
    } catch (error) {
        console.error("❌ Error checking if saved:", error);
        throw error;
    }
}

/**
 * Get all saved resources
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} Saved resources
 */
async function getSavedResources(studentId) {
    try {
        const q = query(
            collection(db, PROGRESS_COLLECTION, studentId, "resources"),
            where("isSaved", "==", true),
            orderBy("lastAccessedAt", "desc")
        );

        const snapshot = await getDocs(q);

        const resources = snapshot.docs.map(doc => ({
            ...doc.data(),
            resourceId: doc.id,
        }));

        console.log(`✅ Got ${resources.length} saved resources for ${studentId}`);
        return resources;
    } catch (error) {
        console.error("❌ Error getting saved resources:", error);
        throw error;
    }
}

/**
 * Get saved resources count
 * @param {string} studentId - Student ID
 * @returns {Promise<number>} Number of saved resources
 */
async function getSavedResourcesCount(studentId) {
    try {
        const resources = await getSavedResources(studentId);
        return resources.length;
    } catch (error) {
        console.error("❌ Error getting saved resources count:", error);
        throw error;
    }
}

/* ============================================================
   LIKE RESOURCE
============================================================ */

/**
 * Like a resource (appreciation)
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<void>}
 */
async function likeResource(studentId, resourceId) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Create progress entry if doesn't exist
            await startReading(studentId, resourceId);
        }

        await updateDoc(docRef, {
            isLiked: true,
            lastAccessedAt: Timestamp.now(),
        });

        console.log(`✅ Liked resource: ${studentId} → ${resourceId}`);
    } catch (error) {
        console.error("❌ Error liking resource:", error);
        throw error;
    }
}

/**
 * Unlike a resource
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<void>}
 */
async function unlikeResource(studentId, resourceId) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);

        await updateDoc(docRef, {
            isLiked: false,
        });

        console.log(`✅ Unliked resource: ${studentId} → ${resourceId}`);
    } catch (error) {
        console.error("❌ Error unliking resource:", error);
        throw error;
    }
}

/**
 * Check if resource is liked
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<boolean>} Is liked?
 */
async function isLiked(studentId, resourceId) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return false;
        }

        return docSnap.data().isLiked || false;
    } catch (error) {
        console.error("❌ Error checking if liked:", error);
        throw error;
    }
}

/**
 * Get all liked resources
 * @param {string} studentId - Student ID
 * @returns {Promise<Array>} Liked resources
 */
async function getLikedResources(studentId) {
    try {
        const q = query(
            collection(db, PROGRESS_COLLECTION, studentId, "resources"),
            where("isLiked", "==", true),
            orderBy("lastAccessedAt", "desc")
        );

        const snapshot = await getDocs(q);

        const resources = snapshot.docs.map(doc => ({
            ...doc.data(),
            resourceId: doc.id,
        }));

        console.log(`✅ Got ${resources.length} liked resources for ${studentId}`);
        return resources;
    } catch (error) {
        console.error("❌ Error getting liked resources:", error);
        throw error;
    }
}

/**
 * Get liked resources count
 * @param {string} studentId - Student ID
 * @returns {Promise<number>} Number of liked resources
 */
async function getLikedResourcesCount(studentId) {
    try {
        const resources = await getLikedResources(studentId);
        return resources.length;
    } catch (error) {
        console.error("❌ Error getting liked resources count:", error);
        throw error;
    }
}

/* ============================================================
   COMBINED ACTIONS
============================================================ */

/**
 * Toggle save status (save if not saved, unsave if saved)
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<boolean>} New save status
 */
async function toggleSave(studentId, resourceId) {
    try {
        const saved = await isSaved(studentId, resourceId);

        if (saved) {
            await unsaveResource(studentId, resourceId);
            return false;
        } else {
            await saveResource(studentId, resourceId);
            return true;
        }
    } catch (error) {
        console.error("❌ Error toggling save:", error);
        throw error;
    }
}

/**
 * Toggle like status (like if not liked, unlike if liked)
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<boolean>} New like status
 */
async function toggleLike(studentId, resourceId) {
    try {
        const liked = await isLiked(studentId, resourceId);

        if (liked) {
            await unlikeResource(studentId, resourceId);
            return false;
        } else {
            await likeResource(studentId, resourceId);
            return true;
        }
    } catch (error) {
        console.error("❌ Error toggling like:", error);
        throw error;
    }
}

/**
 * Get bookmark status for resource
 * @param {string} studentId - Student ID
 * @param {string} resourceId - Resource ID
 * @returns {Promise<Object>} { isSaved, isLiked }
 */
async function getBookmarkStatus(studentId, resourceId) {
    try {
        const docRef = doc(db, PROGRESS_COLLECTION, studentId, "resources", resourceId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return {
                isSaved: false,
                isLiked: false,
            };
        }

        const data = docSnap.data();
        return {
            isSaved: data.isSaved || false,
            isLiked: data.isLiked || false,
        };
    } catch (error) {
        console.error("❌ Error getting bookmark status:", error);
        throw error;
    }
}

/**
 * Get all resources with bookmark status
 * (for displaying UI with indicators)
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} { saved: [...], liked: [...], both: [...] }
 */
async function getAllBookmarks(studentId) {
    try {
        const q = query(
            collection(db, PROGRESS_COLLECTION, studentId, "resources"),
            where("isSaved", "==", true)
        );

        // Could also query isLiked, but for simplicity:
        const saved = await getSavedResources(studentId);
        const liked = await getLikedResources(studentId);

        const savedIds = new Set(saved.map(r => r.resourceId));
        const likedIds = new Set(liked.map(r => r.resourceId));

        const both = saved.filter(r => likedIds.has(r.resourceId));
        const savedOnly = saved.filter(r => !likedIds.has(r.resourceId));
        const likedOnly = liked.filter(r => !savedIds.has(r.resourceId));

        return {
            saved,
            liked,
            both,
            savedOnly,
            likedOnly,
            savedCount: saved.length,
            likedCount: liked.length,
            bothCount: both.length,
        };
    } catch (error) {
        console.error("❌ Error getting all bookmarks:", error);
        throw error;
    }
}

/* ============================================================
   EXPORTS
============================================================ */

export {
    saveResource,
    unsaveResource,
    isSaved,
    getSavedResources,
    getSavedResourcesCount,
    likeResource,
    unlikeResource,
    isLiked,
    getLikedResources,
    getLikedResourcesCount,
    toggleSave,
    toggleLike,
    getBookmarkStatus,
    getAllBookmarks,
};

export default {
    saveResource,
    unsaveResource,
    isSaved,
    getSavedResources,
    getSavedResourcesCount,
    likeResource,
    unlikeResource,
    isLiked,
    getLikedResources,
    getLikedResourcesCount,
    toggleSave,
    toggleLike,
    getBookmarkStatus,
    getAllBookmarks,
};
