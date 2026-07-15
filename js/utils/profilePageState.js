const PROFILE_STATE_KEY = 'sword_profile_page_state';

function getInitialProfile(overrides = {}) {
    const fallbackName = 'Aisha Morgan';
    const fullName = String(overrides.fullName || fallbackName).trim() || fallbackName;
    const initials = getInitialsFromName(fullName);

    return {
        fullName,
        role: 'Student • Leadership',
        email: 'learner@swordinstitute.com',
        phone: '',
        country: 'Nigeria',
        profession: 'Community Development Lead',
        organization: 'Bright Path Initiative',
        bio: 'Learning with purpose, building practical skills for impact.',
        avatarInitials: initials,
        status: 'Online',
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

function getInitialsFromName(name = '') {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'SU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function sanitizeProfile(profile = {}) {
    const base = getInitialProfile(profile);
    const fullName = String(base.fullName || '').trim() || 'Aisha Morgan';
    const initials = String(base.avatarInitials || '').trim() || getInitialsFromName(fullName);

    return {
        ...base,
        fullName,
        role: String(base.role || '').trim() || 'Student • Leadership',
        email: String(base.email || '').trim() || 'learner@swordinstitute.com',
        phone: String(base.phone || '').trim(),
        country: String(base.country || '').trim(),
        profession: String(base.profession || '').trim(),
        organization: String(base.organization || '').trim(),
        bio: String(base.bio || '').trim(),
        avatarInitials: initials,
        status: String(base.status || '').trim() || 'Online',
        updatedAt: String(base.updatedAt || new Date().toISOString()),
    };
}

function loadProfileState(storage = window.localStorage) {
    if (!storage) return getInitialProfile();

    try {
        const raw = storage.getItem(PROFILE_STATE_KEY);
        if (!raw) return getInitialProfile();
        const parsed = JSON.parse(raw);
        return sanitizeProfile(parsed);
    } catch (error) {
        console.warn('Unable to read profile state', error);
        return getInitialProfile();
    }
}

function mergeProfileState(localProfile = {}, remoteProfile = {}) {
    const base = sanitizeProfile(localProfile);

    const pickValue = (remoteValue, localValue, fallback = '') => {
        const remoteCandidate = String(remoteValue ?? '').trim();
        if (remoteCandidate) return remoteCandidate;
        const localCandidate = String(localValue ?? '').trim();
        return localCandidate || fallback;
    };

    const merged = {
        ...base,
        fullName: pickValue(remoteProfile?.fullName, base.fullName, 'Aisha Morgan'),
        email: pickValue(remoteProfile?.email, base.email, 'learner@swordinstitute.com'),
        phone: pickValue(remoteProfile?.phone, base.phone, ''),
        country: pickValue(remoteProfile?.country, base.country, 'Nigeria'),
        profession: pickValue(remoteProfile?.profession, base.profession, 'Community Development Lead'),
        organization: pickValue(remoteProfile?.organization, base.organization, 'Bright Path Initiative'),
        bio: pickValue(remoteProfile?.bio, base.bio, 'Learning with purpose, building practical skills for impact.'),
        role: pickValue(remoteProfile?.role, base.role, 'Student • Leadership'),
        status: pickValue(remoteProfile?.status, base.status, 'Online'),
        avatarInitials: pickValue(remoteProfile?.avatarInitials, base.avatarInitials, getInitialsFromName(String(remoteProfile?.fullName || base.fullName || 'Aisha Morgan'))),
        updatedAt: pickValue(remoteProfile?.updatedAt, base.updatedAt, new Date().toISOString()),
    };

    return sanitizeProfile(merged);
}

function saveProfileState(profile, storage = window.localStorage) {
    const nextProfile = sanitizeProfile(profile);
    if (storage) {
        storage.setItem(PROFILE_STATE_KEY, JSON.stringify(nextProfile));
    }
    return nextProfile;
}

function clearProfileState(storage = window.localStorage) {
    if (storage) {
        storage.removeItem(PROFILE_STATE_KEY);
    }
    return getInitialProfile();
}

export { PROFILE_STATE_KEY, getInitialProfile, sanitizeProfile, mergeProfileState, loadProfileState, saveProfileState, clearProfileState };
export default { PROFILE_STATE_KEY, getInitialProfile, sanitizeProfile, mergeProfileState, loadProfileState, saveProfileState, clearProfileState };