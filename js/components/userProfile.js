import { getCurrentUser } from '../services/authService.js';
import { getStudentProfile } from '../services/studentProfileService.js';

const profileCache = new Map();
const pendingLoads = new Map();

function getInitials(displayName = '') {
    const name = String(displayName || '').trim();
    if (!name) return 'SG';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function normalizeProfileView(profile, user) {
    const displayName = profile?.fullName || profile?.studentName || user?.displayName || user?.email?.split('@')[0] || 'Michael Gwara';
    const email = profile?.email || user?.email || '';
    const photoURL = profile?.photoURL || user?.photoURL || '';
    return {
        uid: user?.uid || profile?.uid || 'guest',
        displayName,
        initials: getInitials(displayName),
        email,
        photoURL,
        role: profile?.academy || 'Student',
        online: true,
    };
}

export async function getUserProfileView(user = getCurrentUser()) {
    if (!user) return null;

    const uid = user.uid;
    if (profileCache.has(uid)) {
        return profileCache.get(uid);
    }

    if (pendingLoads.has(uid)) {
        return pendingLoads.get(uid);
    }

    const pending = (async () => {
        const profile = await getStudentProfile(uid, {
            userData: {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
            },
        });
        const view = normalizeProfileView(profile, user);
        profileCache.set(uid, view);
        return view;
    })();

    pendingLoads.set(uid, pending);
    try {
        return await pending;
    } finally {
        pendingLoads.delete(uid);
    }
}

export function clearUserProfileCache() {
    profileCache.clear();
}

export { getInitials };
export default { getUserProfileView, clearUserProfileCache, getInitials };
