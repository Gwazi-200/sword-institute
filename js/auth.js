/**
 * ============================================================
 * auth.js — Firebase Authentication Service
 * Sword Institute LMS
 * Version: 1.0.0
 * ============================================================
 * 
 * This file contains ONLY Firebase Authentication logic.
 * NO HTML, NO DOM manipulation, NO event listeners.
 * 
 * Functions:
 *   - registerUser()
 *   - loginUser()
 *   - logoutUser()
 *   - getCurrentUser()
 *   - sendVerificationEmail()
 *   - resetPassword()
 *   - updateProfile()
 *   - reloadUser()
 * 
 * ============================================================
 */

import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile as firebaseUpdateProfile,
    onAuthStateChanged,
    reload as firebaseReload
} from 'firebase/auth';

import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';

import { auth, db } from './firebase-config.js';

// ============================================================
// STATE
// ============================================================
let currentUser = null;
let authListeners = [];

// ============================================================
// REGISTER USER
// ============================================================

/**
 * Register a new student user
 * 
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password
 * @param {string} userData.fullName - User's full name
 * @param {string} userData.phone - User's phone number
 * @param {string} userData.country - User's country
 * @param {Object} options - Additional options
 * @param {boolean} options.sendVerification - Send email verification
 * @returns {Promise<Object>} Created user object
 */
export async function registerUser(userData, options = { sendVerification: true }) {
    const { email, password, fullName, phone, country } = userData;

    if (!email || !password || !fullName) {
        throw new Error('Email, password, and full name are required.');
    }

    console.log('📝 Creating Firebase account for:', email);

    try {
        // Step 1: Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('✅ Authentication successful. UID:', user.uid);

        // Step 2: Update profile with display name
        await firebaseUpdateProfile(user, {
            displayName: fullName
        });
        console.log('✅ Profile updated with display name.');

        // Step 3: Send email verification
        if (options.sendVerification) {
            try {
                await sendEmailVerification(user);
                console.log('✅ Verification email sent.');
            } catch (verifyError) {
                console.warn('⚠️ Email verification failed:', verifyError);
            }
        }

        // Step 4: Create Firestore student document
        const studentData = {
            uid: user.uid,
            fullName: fullName,
            email: email,
            phone: phone || '',
            country: country || '',
            role: 'student',
            status: 'active',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            learningStreak: 0,
            progress: 0,
            coursesCompleted: 0,
            currentCourse: '',
            certificateCount: 0,
            photoURL: '',
            preferences: {
                dailyStudyGoal: 30,
                preferredTime: '',
                notifications: true
            }
        };

        await setDoc(doc(db, 'students', user.uid), studentData);
        console.log('✅ Firestore student document created.');

        // Step 5: Set current user
        currentUser = {
            uid: user.uid,
            email: user.email,
            fullName: fullName,
            phone: phone || '',
            country: country || '',
            ...studentData
        };

        return currentUser;

    } catch (error) {
        console.error('❌ Registration error:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('This email is already registered. Please log in.');
        }
        if (error.code === 'auth/invalid-email') {
            throw new Error('Invalid email address format.');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('Password is too weak. Please choose a stronger password.');
        }
        if (error.code === 'auth/network-request-failed') {
            throw new Error('Network error. Please check your connection and try again.');
        }
        if (error.code === 'auth/too-many-requests') {
            throw new Error('Too many attempts. Please wait a moment and try again.');
        }
        if (error.code === 'auth/operation-not-allowed') {
            throw new Error('Registration is currently disabled. Please contact support.');
        }
        
        throw new Error(error.message || 'Registration failed. Please try again.');
    }
}

// ============================================================
// LOGIN USER
// ============================================================

/**
 * Log in an existing user
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} User object
 */
export async function loginUser(email, password) {
    if (!email || !password) {
        throw new Error('Email and password are required.');
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('✅ Login successful. UID:', user.uid);

        // Update last login in Firestore
        try {
            const studentRef = doc(db, 'students', user.uid);
            await updateDoc(studentRef, {
                lastLogin: serverTimestamp()
            });
        } catch (updateError) {
            console.warn('⚠️ Could not update last login:', updateError);
        }

        // Fetch user profile
        const profile = await getUserProfile(user.uid);
        currentUser = {
            uid: user.uid,
            email: user.email,
            ...profile
        };

        return currentUser;

    } catch (error) {
        console.error('❌ Login error:', error);

        if (error.code === 'auth/user-not-found') {
            throw new Error('No account found with this email.');
        }
        if (error.code === 'auth/wrong-password') {
            throw new Error('Incorrect password. Please try again.');
        }
        if (error.code === 'auth/invalid-email') {
            throw new Error('Invalid email address format.');
        }
        if (error.code === 'auth/network-request-failed') {
            throw new Error('Network error. Please check your connection.');
        }
        if (error.code === 'auth/too-many-requests') {
            throw new Error('Too many failed attempts. Please try again later.');
        }
        if (error.code === 'auth/user-disabled') {
            throw new Error('This account has been disabled. Please contact support.');
        }

        throw new Error(error.message || 'Login failed. Please try again.');
    }
}

// ============================================================
// LOGOUT USER
// ============================================================

/**
 * Log out the current user
 * 
 * @returns {Promise<void>}
 */
export async function logoutUser() {
    try {
        await signOut(auth);
        currentUser = null;
        console.log('✅ User logged out.');
    } catch (error) {
        console.error('❌ Logout error:', error);
        throw new Error('Logout failed. Please try again.');
    }
}

// ============================================================
// USER PROFILE
// ============================================================

/**
 * Get user profile from Firestore
 * 
 * @param {string} uid - User's Firebase UID
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(uid) {
    try {
        const docRef = doc(db, 'students', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            throw new Error('User profile not found.');
        }
    } catch (error) {
        console.error('❌ Get profile error:', error);
        throw new Error('Could not retrieve user profile.');
    }
}

/**
 * Update user profile
 * 
 * @param {string} uid - User's Firebase UID
 * @param {Object} data - Profile fields to update
 * @returns {Promise<Object>} Updated profile data
 */
export async function updateProfile(uid, data) {
    try {
        const docRef = doc(db, 'students', uid);
        await updateDoc(docRef, {
            ...data,
            lastActivity: serverTimestamp()
        });
        return await getUserProfile(uid);
    } catch (error) {
        console.error('❌ Update profile error:', error);
        throw new Error('Could not update profile.');
    }
}

// ============================================================
// AUTH STATE
// ============================================================

/**
 * Get the currently logged-in user
 * 
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Check if user is authenticated
 * 
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
    return !!currentUser;
}

/**
 * Subscribe to auth state changes
 * 
 * @param {Function} listener - Callback function
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(listener) {
    if (typeof listener !== 'function') {
        throw new Error('Listener must be a function.');
    }

    authListeners.push(listener);

    return () => {
        const index = authListeners.indexOf(listener);
        if (index !== -1) {
            authListeners.splice(index, 1);
        }
    };
}

/**
 * Initialize auth state listener
 * 
 * @param {Function} onUserChange - Callback when user changes
 * @returns {Function} Unsubscribe function
 */
export function initAuthListener(onUserChange) {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const profile = await getUserProfile(user.uid);
                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    ...profile
                };
                console.log('✅ User authenticated:', currentUser.fullName);
            } catch (error) {
                console.warn('⚠️ Could not fetch user profile:', error);
                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    fullName: user.displayName || 'Student'
                };
            }
        } else {
            currentUser = null;
            console.log('👤 User signed out.');
        }

        authListeners.forEach(listener => {
            try {
                listener(currentUser);
            } catch (listenerError) {
                console.error('❌ Auth state listener error:', listenerError);
            }
        });

        if (onUserChange && typeof onUserChange === 'function') {
            onUserChange(currentUser);
        }
    });

    return unsubscribe;
}

// ============================================================
// EMAIL VERIFICATION
// ============================================================

/**
 * Send email verification
 * 
 * @returns {Promise<void>}
 */
export async function sendVerificationEmail() {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('No user logged in.');
    }

    try {
        await sendEmailVerification(user);
        console.log('✅ Verification email sent.');
    } catch (error) {
        console.error('❌ Send verification error:', error);
        throw new Error('Could not send verification email.');
    }
}

/**
 * Check if current user's email is verified
 * 
 * @returns {boolean} True if verified
 */
export function isEmailVerified() {
    const user = auth.currentUser;
    return user ? user.emailVerified : false;
}

/**
 * Reload current user (refresh auth state)
 * 
 * @returns {Promise<void>}
 */
export async function reloadUser() {
    const user = auth.currentUser;
    if (user) {
        await firebaseReload(user);
        console.log('✅ User reloaded.');
    }
}

// ============================================================
// PASSWORD MANAGEMENT
// ============================================================

/**
 * Send password reset email
 * 
 * @param {string} email - User's email address
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
    if (!email) {
        throw new Error('Email address is required.');
    }

    try {
        await sendPasswordResetEmail(auth, email);
        console.log('✅ Password reset email sent.');
    } catch (error) {
        console.error('❌ Password reset error:', error);

        if (error.code === 'auth/user-not-found') {
            throw new Error('No account found with this email.');
        }
        if (error.code === 'auth/invalid-email') {
            throw new Error('Invalid email address format.');
        }
        if (error.code === 'auth/network-request-failed') {
            throw new Error('Network error. Please check your connection.');
        }

        throw new Error(error.message || 'Password reset failed. Please try again.');
    }
}

// ============================================================
// ADMIN HELPERS
// ============================================================

/**
 * Get all students (requires proper security rules)
 * 
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} List of students
 */
export async function getAllStudents(filters = {}) {
    try {
        let q = collection(db, 'students');
        
        if (filters.status) {
            q = query(q, where('status', '==', filters.status));
        }
        
        if (filters.role) {
            q = query(q, where('role', '==', filters.role));
        }

        const querySnapshot = await getDocs(q);
        const students = [];
        querySnapshot.forEach((doc) => {
            students.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return students;
    } catch (error) {
        console.error('❌ Get students error:', error);
        throw new Error('Could not retrieve students.');
    }
}

// ============================================================
// CONSOLE BANNER
// ============================================================
console.log('🔐 Auth module loaded successfully.');

// ============================================================
// EXPORTS
// ============================================================
export default {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    isAuthenticated,
    getUserProfile,
    updateProfile,
    resetPassword,
    sendVerificationEmail,
    isEmailVerified,
    reloadUser,
    onAuthStateChange,
    initAuthListener,
    getAllStudents
};