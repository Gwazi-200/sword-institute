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
    try {
        console.info('[ProfileService] Fetching profile record', { uid });
        const profileRef = doc(db, PROFILE_COLLECTION, uid);
        const snapshot = await getDoc(profileRef);

        if (!snapshot.exists()) {
            console.info('[ProfileService] No profile document found for user', { uid });
            return {};
        }

        const data = snapshot.data() || {};
        console.info('[ProfileService] Profile record loaded', { uid, keys: Object.keys(data) });
        return data;
    } catch (error) {
        console.error('[ProfileService] Failed to read profile record', error, { uid });
        throw error;
    }
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
    try {
        console.info('[ProfileService] Writing profile update', { uid, payload });
        await setDoc(profileRef, payload, { merge: true });
        console.info('[ProfileService] Profile update written to Firestore', { uid });
        const fresh = await getProfileCenterRecord(uid);
        return { ...fresh, ...payload };
    } catch (error) {
        console.error('[ProfileService] Failed to write profile update', error, { uid, payload });
        throw error;
    }
}

async function uploadProfilePhoto(uid, file) {
    if (!uid || !file) {
        throw new Error('A valid photo file is required.');
    }

    const photoRef = ref(storage, `users/${uid}/profile-photo.jpg`);
    try {
        await uploadBytes(photoRef, file);
        const downloadURL = await getDownloadURL(photoRef);
        console.info('[ProfileService] Uploaded profile photo, updating profile record', { uid });
        await updateProfileCenter(uid, { photoURL: downloadURL });
        console.info('[ProfileService] Profile photo URL saved', { uid, downloadURL });
        return downloadURL;
    } catch (error) {
        console.error('[ProfileService] Failed to upload or save profile photo', error, { uid });
        throw error;
    }
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
    try {
        console.info('[ProfileService] Removing profile photo reference and clearing URL', { uid });
        await updateProfileCenter(uid, { photoURL: '' });
        return '';
    } catch (error) {
        console.error('[ProfileService] Failed to clear profile photo URL', error, { uid });
        throw error;
    }
}

export { getProfileCenterRecord, updateProfileCenter, uploadProfilePhoto, removeProfilePhoto, PROFILE_COLLECTION };
export default { getProfileCenterRecord, updateProfileCenter, uploadProfilePhoto, removeProfilePhoto, PROFILE_COLLECTION };