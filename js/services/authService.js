import { auth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '../firebase.js';

function subscribeToAuth(listener) {
    return onAuthStateChanged(auth, listener);
}

async function signOutUser() {
    await signOut(auth);
}

async function signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

async function register(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
        await updateProfile(result.user, { displayName });
    }
    return result;
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