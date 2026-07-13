import { getCurrentUser } from './authService.js';

export function getProfileSummary() {
    const user = getCurrentUser();
    return {
        uid: user?.uid || null,
        email: user?.email || null,
        displayName: user?.displayName || user?.email || 'Learner',
    };
}

export default { getProfileSummary };