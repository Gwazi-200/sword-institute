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