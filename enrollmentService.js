/**
 * enrollmentService.js
 * Sword Institute LMS - Enrollment Service
 * Handles all course enrollment logic
 */

import {
    db,
    auth,
    collection,
    doc,
    addDoc,
    getDocs,
    query,
    where,
    getDoc,
    deleteDoc,
    updateDoc,
    serverTimestamp
} from './firebase.js';

/**
 * Enroll a user in a course
 * @param {string} courseId - The course ID to enroll in
 * @returns {Promise<Object>} - Result object with success status
 */
export async function enrollInCourse(courseId) {
    const user = auth.currentUser;
    
    if (!user) {
        console.warn('User must be logged in to enroll');
        return { success: false, error: 'Please log in first' };
    }

    try {
        // Check if already enrolled
        const existing = await checkEnrollment(user.uid, courseId);
        if (existing) {
            return { success: false, error: 'Already enrolled in this course' };
        }

        // Create enrollment document
        const enrollmentRef = await addDoc(collection(db, 'enrollments'), {
            userId: user.uid,
            courseId: courseId,
            enrolledAt: serverTimestamp(),
            completed: false,
            progress: 0,
            xpEarned: 0,
            lastAccessed: serverTimestamp(),
            status: 'active'
        });

        console.log(`✅ Enrolled in course ${courseId}`);
        return { success: true, enrollmentId: enrollmentRef.id };

    } catch (error) {
        console.error('Error enrolling in course:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if a user is enrolled in a specific course
 * @param {string} userId - The user's UID
 * @param {string} courseId - The course ID
 * @returns {Promise<boolean>} - True if enrolled
 */
export async function checkEnrollment(userId, courseId) {
    try {
        const enrollmentsRef = collection(db, 'enrollments');
        const q = query(
            enrollmentsRef,
            where('userId', '==', userId),
            where('courseId', '==', courseId)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking enrollment:', error);
        return false;
    }
}

/**
 * Get all enrollments for a user
 * @param {string} userId - The user's UID
 * @returns {Promise<Array>} - Array of enrollment documents with course data
 */
export async function getUserEnrollments(userId) {
    try {
        const enrollmentsRef = collection(db, 'enrollments');
        const q = query(
            enrollmentsRef,
            where('userId', '==', userId),
            where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        
        const enrollments = [];
        snapshot.forEach((doc) => {
            enrollments.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return enrollments;
    } catch (error) {
        console.error('Error getting user enrollments:', error);
        return [];
    }
}

/**
 * Get enrollment status for multiple courses at once
 * @param {string} userId - The user's UID
 * @param {Array<string>} courseIds - Array of course IDs
 * @returns {Promise<Object>} - Map of courseId -> boolean
 */
export async function getBulkEnrollmentStatus(userId, courseIds) {
    if (!userId || !courseIds || courseIds.length === 0) {
        return {};
    }

    try {
        const enrollmentsRef = collection(db, 'enrollments');
        const q = query(
            enrollmentsRef,
            where('userId', '==', userId),
            where('courseId', 'in', courseIds)
        );
        const snapshot = await getDocs(q);
        
        const enrolledMap = {};
        snapshot.forEach((doc) => {
            const data = doc.data();
            enrolledMap[data.courseId] = true;
        });
        
        return enrolledMap;
    } catch (error) {
        console.error('Error getting bulk enrollment status:', error);
        return {};
    }
}

/**
 * Unenroll from a course
 * @param {string} enrollmentId - The enrollment document ID
 * @returns {Promise<Object>} - Result object
 */
export async function unenrollFromCourse(enrollmentId) {
    try {
        await deleteDoc(doc(db, 'enrollments', enrollmentId));
        console.log(`✅ Unenrolled from course ${enrollmentId}`);
        return { success: true };
    } catch (error) {
        console.error('Error unenrolling:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update course progress
 * @param {string} enrollmentId - The enrollment document ID
 * @param {number} progress - Progress percentage (0-100)
 * @param {number} xpEarned - XP earned from this session
 * @returns {Promise<Object>} - Result object
 */
export async function updateProgress(enrollmentId, progress, xpEarned = 0) {
    try {
        const enrollmentRef = doc(db, 'enrollments', enrollmentId);
        const updates = {
            progress: progress,
            lastAccessed: serverTimestamp()
        };
        
        if (xpEarned > 0) {
            updates.xpEarned = xpEarned;
        }
        
        // If progress is 100%, mark as completed
        if (progress >= 100) {
            updates.completed = true;
            updates.completedAt = serverTimestamp();
        }
        
        await updateDoc(enrollmentRef, updates);
        return { success: true };
    } catch (error) {
        console.error('Error updating progress:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get enrolled course details with full course data
 * @param {string} userId - The user's UID
 * @param {Function} getCourseFn - Function to fetch course details
 * @returns {Promise<Array>} - Array of courses with enrollment data
 */
export async function getEnrolledCoursesWithDetails(userId, getCourseFn) {
    const enrollments = await getUserEnrollments(userId);
    
    if (enrollments.length === 0) {
        return [];
    }

    const courses = [];
    for (const enrollment of enrollments) {
        try {
            const courseData = await getCourseFn(enrollment.courseId);
            if (courseData) {
                courses.push({
                    ...courseData,
                    enrollmentId: enrollment.id,
                    progress: enrollment.progress || 0,
                    completed: enrollment.completed || false,
                    xpEarned: enrollment.xpEarned || 0,
                    enrolledAt: enrollment.enrolledAt
                });
            }
        } catch (error) {
            console.warn(`Could not fetch course ${enrollment.courseId}:`, error);
        }
    }
    
    return courses;
}

// Export default for convenience
export default {
    enrollInCourse,
    checkEnrollment,
    getUserEnrollments,
    getBulkEnrollmentStatus,
    unenrollFromCourse,
    updateProgress,
    getEnrolledCoursesWithDetails
};