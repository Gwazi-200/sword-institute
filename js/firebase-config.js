/**
 * ============================================================
 * Sword Institute LMS
 * Firebase Configuration
 * Version: 2.0.0
 * ============================================================
 *
 * This file is the SINGLE source of Firebase imports.
 *
 * Never import directly from:
 * firebase/app
 * firebase/auth
 * firebase/firestore
 *
 * Every other file must import ONLY from:
 *
 *      ./firebase.js
 *
 * ============================================================
 */

import { initializeApp } from "firebase/app";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged
} from "firebase/auth";

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
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove
} from "firebase/firestore";

/* ============================================================
   FIREBASE CONFIGURATION
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
   INITIALIZE FIREBASE
============================================================ */

const app = initializeApp(firebaseConfig);

/* ============================================================
   SERVICES
============================================================ */

const auth = getAuth(app);

const db = getFirestore(app);

/* ============================================================
   EXPORT SERVICES
============================================================ */

export {

    app,

    auth,

    db,

    // Authentication

    createUserWithEmailAndPassword,

    signInWithEmailAndPassword,

    signOut,

    sendEmailVerification,

    sendPasswordResetEmail,

    updateProfile,

    onAuthStateChanged,

    // Firestore

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

    serverTimestamp,

    increment,

    arrayUnion,

    arrayRemove

};

export default app;

/* ============================================================
   STARTUP MESSAGE
============================================================ */

console.log(`
==========================================
⚔ Sword Institute LMS
🔥 Firebase Initialized Successfully
==========================================
Project : sword-institute-lms
Version : 2.0.0
==========================================
`);