/**
 * ============================================================
 * firebase-config.js — Firebase Configuration
 * Sword Institute LMS
 * Version: 1.0.0
 * ============================================================
 * 
 * This file contains ONLY Firebase initialization and exports.
 * NO UI code, NO form logic, NO event listeners.
 * 
 * ============================================================
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyD6lVyvaA7uhcX3qvxvOp3dqiGxb8Td4xs",
    authDomain: "sword-institute-lms.firebaseapp.com",
    projectId: "sword-institute-lms",
    storageBucket: "sword-institute-lms.firebasestorage.app",
    messagingSenderId: "478896038426",
    appId: "1:478896038426:web:c24c6373edc1cba14a67a3"
};

// ============================================================
// INITIALIZE FIREBASE
// ============================================================
const app = initializeApp(firebaseConfig);

// ============================================================
// EXPORT SERVICES
// ============================================================
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

// ============================================================
// CONSOLE BANNER
// ============================================================
console.log('🔥 Firebase initialized successfully.');