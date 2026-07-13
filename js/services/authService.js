import { auth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../firebase.js';
import { trackEvent } from './loggingService.js';
import { handleError } from './errorService.js';

function subscribeToAuth(listener) {
    return onAuthStateChanged(auth, listener);
}

async function signOutUser() {
    try {
        await signOut(auth);
        trackEvent('logout');
        return true;
    } catch (error) {
        handleError(error, 'auth');
        return false;
    }
}

async function signIn(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        trackEvent('login', { uid: result?.user?.uid });
        return result;
    } catch (error) {
        handleError(error, 'auth');
        throw error;
    }
}

async function register(email, password, displayName) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
            await updateProfile(result.user, { displayName });
        }
        trackEvent('register', { uid: result?.user?.uid, displayName });
        return result;
    } catch (error) {
        handleError(error, 'auth');
        throw error;
    }
}

function getCurrentUser() {
    return auth.currentUser;
}

function getDisplayName(user = getCurrentUser()) {
    return user?.displayName || user?.email || 'Learner';
}

function getUserInitials(user = getCurrentUser()) {
    const name = getDisplayName(user);
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'L';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export { subscribeToAuth, signOutUser, signIn, register, getCurrentUser, getDisplayName, getUserInitials };
export default { subscribeToAuth, signOutUser, signIn, register, getCurrentUser, getDisplayName, getUserInitials };