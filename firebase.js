/**
 * ============================================================
 * Sword Institute LMS
 * Firebase Unified Export Module
 * Version: 1.0.0
 * ============================================================
 *
 * Central Firebase export module.
 *
 * CANONICAL IMPORTS:
 * - All files MUST import from "./firebase.js"
 * - Never import directly from Firebase SDK modules
 * - Never import from "firebase-config.js" directly
 *
 * This ensures single source of truth for Firebase setup.
 * ============================================================
 */

import {
    app,
    auth,
    db,
    storage,
    functions,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    collection,
    collectionGroup,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    writeBatch,
    runTransaction,
    serverTimestamp,
    Timestamp,
    increment,
    arrayUnion,
    arrayRemove,
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    httpsCallable
} from './firebase-config.js';

/**
 * Export all Firebase services and utilities
 */
export {
    // App
    app,
    // Authentication
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    // Firestore
    db,
    collection,
    collectionGroup,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    writeBatch,
    runTransaction,
    serverTimestamp,
    Timestamp,
    increment,
    arrayUnion,
    arrayRemove,
    // Storage
    storage,
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    // Functions
    functions,
    httpsCallable
};

export default app;