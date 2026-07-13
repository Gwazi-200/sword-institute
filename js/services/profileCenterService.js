import {
    db,
    doc,
    getDoc,
    setDoc,
    storage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from '../firebase.js';

const PROFILE_COLLECTION = 'users';

async function getProfileCenterRecord(uid) {
    if (!uid) return null;

    const profileRef = doc(db, PROFILE_COLLECTION, uid);
    const snapshot = await getDoc(profileRef);

    if (!snapshot.exists()) {
        return {};
    }

    return snapshot.data() || {};
}

async function updateProfileCenter(uid, updates = {}) {
    if (!uid) {
        throw new Error('A user id is required to update the profile center.');
    }

    const profileRef = doc(db, PROFILE_COLLECTION, uid);
    const payload = {
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    await setDoc(profileRef, payload, { merge: true });
    return { ...(await getProfileCenterRecord(uid)), ...payload };
}

async function uploadProfilePhoto(uid, file) {
    if (!uid || !file) {
        throw new Error('A valid photo file is required.');
    }

    const photoRef = ref(storage, `users/${uid}/profile-photo.jpg`);
    await uploadBytes(photoRef, file);
    const downloadURL = await getDownloadURL(photoRef);
    await updateProfileCenter(uid, { photoURL: downloadURL });
    return downloadURL;
}

async function removeProfilePhoto(uid) {
    if (!uid) {
        throw new Error('A user id is required to remove the profile photo.');
    }

    const photoRef = ref(storage, `users/${uid}/profile-photo.jpg`);
    try {
        await deleteObject(photoRef);
    } catch (error) {
        if (!String(error?.message || '').includes('not exist')) {
            throw error;
        }
    }

    await updateProfileCenter(uid, { photoURL: '' });
    return '';
}

export { getProfileCenterRecord, updateProfileCenter, uploadProfilePhoto, removeProfilePhoto, PROFILE_COLLECTION };
export default { getProfileCenterRecord, updateProfileCenter, uploadProfilePhoto, removeProfilePhoto, PROFILE_COLLECTION };