/**
 * ============================================================
 * Sword Institute LMS
 * Firebase Configuration
 * Version: 3.0.0
 * ============================================================
 *
 * CENTRAL FIREBASE MODULE
 *
 * All project files MUST import ONLY from:
 *
 *      ./firebase.js
 *
 * Never import directly from Firebase SDK modules anywhere else.
 * ============================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

/* ============================================================
   AUTHENTICATION
============================================================ */

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

/* ============================================================
   FIRESTORE
============================================================ */

import {
    getFirestore,
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
    arrayRemove
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ============================================================
   STORAGE
============================================================ */

import {
    getStorage,
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

/* ============================================================
   CLOUD FUNCTIONS
============================================================ */

import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";

/* ============================================================
   FIREBASE CONFIG
============================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyD6lVyvaA7uhcX3qvxvOp3dqiGxb8Td4xs",
    authDomain: "sword-institute-lms.firebaseapp.com",
    projectId: "sword-institute-lms",
    storageBucket: "sword-institute-lms.firebasestorage.app",
    messagingSenderId: "478896038426",
    appId: "1:478896038426:web:c24c6373edc1cba14a67a3"
};

/* ============================================================
   INITIALIZE APP
============================================================ */

const app = initializeApp(firebaseConfig);

/* ============================================================
   SERVICES
============================================================ */

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

/* ============================================================
   EXPORTS
============================================================ */

export {
    app,
    auth,
    db,
    storage,
    functions,
    /* Authentication */
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    /* Firestore */
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
    /* Storage */
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    /* Functions */
    httpsCallable
};

export default app;

/* ============================================================
   STARTUP BANNER
============================================================ */

console.clear();

console.log(`
==================================================
⚔ SWORD INSTITUTE LMS
==================================================

🔥 Firebase Connected Successfully

Project   : sword-institute-lms
Version   : 3.0.0

Services
──────────────
✔ Authentication
✔ Cloud Firestore
✔ Cloud Storage
✔ Cloud Functions

Architecture
──────────────
firebase.js
        │
        ▼
firebase-config.js
        │
        ▼
Entire LMS

==================================================
`);