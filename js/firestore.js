import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

/**
 * Save a student document in Firestore.
 * @param {string} uid
 * @param {Object} data
 */
export async function saveStudent(uid, data) {
    if (!uid) throw new Error('Student UID is required.');
    return setDoc(doc(db, 'students', uid), data);
}

/**
 * Update an existing student document.
 * @param {string} uid
 * @param {Object} data
 */
export async function updateStudent(uid, data) {
    if (!uid) throw new Error('Student UID is required.');
    return updateDoc(doc(db, 'students', uid), data);
}

/**
 * Fetch a student document from Firestore.
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function getStudent(uid) {
    if (!uid) throw new Error('Student UID is required.');
    const docSnap = await getDoc(doc(db, 'students', uid));
    return docSnap.exists() ? docSnap.data() : null;
}

/**
 * Delete a student document from Firestore.
 * @param {string} uid
 */
export async function deleteStudent(uid) {
    if (!uid) throw new Error('Student UID is required.');
    return deleteDoc(doc(db, 'students', uid));
}

export default {
    saveStudent,
    updateStudent,
    getStudent,
    deleteStudent
};
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Courses - anyone can read
    match /courses/{courseId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == 'YOUR_ADMIN_UID';
    }
    
    // Enrollments - users can only read/write their own
    match /enrollments/{enrollmentId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // App metadata - anyone can read
    match /app_metadata/{docId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == 'YOUR_ADMIN_UID';
    }
  }
}