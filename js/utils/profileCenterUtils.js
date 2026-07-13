function getInitials(displayName = '') {
    const name = String(displayName || '').trim();
    if (!name) return 'SL';

    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'SL';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getAvatarDisplay(profile = {}, user = {}) {
    const displayName = profile?.fullName || profile?.studentName || profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Student Learner';
    const photoURL = profile?.photoURL || user?.photoURL || '';
    const initials = getInitials(displayName);

    return {
        displayName,
        initials,
        photoURL,
        hasPhoto: Boolean(photoURL),
    };
}

function buildProfileCenterData(profile = {}, user = {}) {
    const avatar = getAvatarDisplay(profile, user);
    const currentCourses = Array.isArray(profile?.currentCourses) ? profile.currentCourses : [];
    const completedCourses = Array.isArray(profile?.completedCourses) ? profile.completedCourses : [];
    const totalCourses = currentCourses.length + completedCourses.length;
    const completionPercentage = totalCourses ? Math.round((completedCourses.length / totalCourses) * 100) : 0;

    return {
        ...avatar,
        role: profile?.academy || profile?.role || user?.role || 'Student',
        email: profile?.email || user?.email || '',
        streak: Number(profile?.currentStreak || profile?.streak || 0),
        xp: Number(profile?.xp || profile?.totalXp || 0),
        enrolledCourses: totalCourses,
        completionPercentage,
        completedCourses: completedCourses.length,
        activeCourses: currentCourses.length,
    };
}

function buildProfileUpdatePayload(values = {}) {
    const normalized = {
        fullName: String(values?.fullName || '').trim(),
        phone: String(values?.phone || '').trim(),
        country: String(values?.country || '').trim(),
        profession: String(values?.profession || '').trim(),
        organization: String(values?.organization || '').trim(),
        bio: String(values?.bio || '').trim(),
        photoURL: String(values?.photoURL || '').trim(),
    };

    return normalized;
}

export { getInitials, getAvatarDisplay, buildProfileCenterData, buildProfileUpdatePayload };
export default { getInitials, getAvatarDisplay, buildProfileCenterData };