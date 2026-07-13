export function getUserSummary(user) {
    return {
        uid: user?.uid || null,
        email: user?.email || null,
        displayName: user?.displayName || user?.email || 'Learner',
    };
}

export default { getUserSummary };