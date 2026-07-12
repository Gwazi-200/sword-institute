import {
    db,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp,
} from '../firebase.js';

const CACHE_TTL_MS = 3 * 60 * 1000;
const STORAGE_PREFIX = 'sword_student_profile_';
let profileCache = new Map();
let pendingLoads = new Map();

function normalizeProfile(profile, uid, userData = {}) {
    const fullName = profile?.fullName || profile?.studentName || profile?.name || userData.fullName || userData.displayName || userData.name || userData.email?.split('@')[0] || 'Student';
    const email = profile?.email || userData.email || '';
    const academy = profile?.academy || userData.academy || 'General';

    return {
        uid: profile?.uid || uid,
        fullName,
        studentName: profile?.studentName || fullName,
        photoURL: profile?.photoURL || userData.photoURL || '',
        email,
        academy,
        currentCourses: Array.isArray(profile?.currentCourses) ? profile.currentCourses : [],
        completedCourses: Array.isArray(profile?.completedCourses) ? profile.completedCourses : [],
        xp: Number(profile?.xp || profile?.totalXp || 0),
        level: Number(profile?.level || 1),
        achievements: Array.isArray(profile?.achievements) ? profile.achievements : [],
        bookmarks: Array.isArray(profile?.bookmarks) ? profile.bookmarks : [],
        knowledgeHubHistory: Array.isArray(profile?.knowledgeHubHistory) ? profile.knowledgeHubHistory : [],
        recentlyViewedCourses: Array.isArray(profile?.recentlyViewedCourses) ? profile.recentlyViewedCourses : [],
        certificates: Array.isArray(profile?.certificates) ? profile.certificates : [],
        badges: Array.isArray(profile?.badges) ? profile.badges : [],
        learningStyle: profile?.learningStyle || 'balanced',
        preferredTheme: profile?.preferredTheme || profile?.theme || 'glass',
        studyTime: profile?.studyTime || '30 min',
        learningGoals: Array.isArray(profile?.learningGoals) && profile.learningGoals.length ? profile.learningGoals : ['Complete your first course'],
        interests: Array.isArray(profile?.interests) && profile.interests.length ? profile.interests : ['Leadership', 'Learning'],
        careerGoal: profile?.careerGoal || 'Grow into a confident professional',
        readingTime: Number(profile?.readingTime || 0),
        averageQuizScore: Number(profile?.averageQuizScore || 0),
        currentStreak: Number(profile?.currentStreak || 0),
        lastLogin: profile?.lastLogin || serverTimestamp(),
        professorMemory: profile?.professorMemory || {
            conversations: [],
            favouriteSubjects: [],
            weakTopics: [],
            strongTopics: [],
            studySchedule: [],
            personalGoals: []
        },
        createdAt: profile?.createdAt || serverTimestamp(),
        updatedAt: profile?.updatedAt || serverTimestamp(),
    };
}

function readCache(uid) {
    const cached = profileCache.get(uid);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        profileCache.delete(uid);
        return null;
    }
    return cached.value;
}

function writeCache(uid, profile) {
    profileCache.set(uid, { value: profile, timestamp: Date.now() });
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`${STORAGE_PREFIX}${uid}`, JSON.stringify(profile));
    }
}

function readLocalStorage(uid) {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${uid}`);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function createDefaultProfile(uid, userData = {}) {
    const baseName = userData.fullName || userData.displayName || userData.name || userData.email?.split('@')[0] || 'Student';
    return {
        uid,
        fullName: baseName,
        studentName: baseName,
        photoURL: userData.photoURL || '',
        email: userData.email || '',
        academy: userData.academy || 'General',
        currentCourses: [],
        completedCourses: [],
        xp: 0,
        level: 1,
        achievements: [],
        bookmarks: [],
        knowledgeHubHistory: [],
        recentlyViewedCourses: [],
        certificates: [],
        badges: [],
        learningStyle: 'balanced',
        preferredTheme: 'glass',
        studyTime: '30 min',
        learningGoals: ['Complete your first course'],
        interests: ['Leadership', 'Learning'],
        careerGoal: 'Grow into a confident professional',
        readingTime: 0,
        averageQuizScore: 0,
        currentStreak: 0,
        lastLogin: serverTimestamp(),
        professorMemory: {
            conversations: [],
            favouriteSubjects: [],
            weakTopics: [],
            strongTopics: [],
            studySchedule: [],
            personalGoals: []
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
}

export async function getStudentProfile(uid, options = {}) {
    if (!uid) return null;
    if (!options.force) {
        const cached = readCache(uid) || readLocalStorage(uid);
        if (cached) return cached;
    }

    if (pendingLoads.has(uid)) {
        return pendingLoads.get(uid);
    }

    const pending = (async () => {
        const profileRef = doc(db, 'students', uid);
        const snap = await getDoc(profileRef);
        const profile = normalizeProfile(snap.exists() ? snap.data() : {}, uid, options.userData || {});
        writeCache(uid, profile);
        return profile;
    })();

    pendingLoads.set(uid, pending);
    try {
        return await pending;
    } finally {
        pendingLoads.delete(uid);
    }
}

export async function ensureStudentProfile(uid, userData = {}) {
    if (!uid) return null;

    const cached = readCache(uid) || readLocalStorage(uid);
    if (cached) return cached;

    const profileRef = doc(db, 'students', uid);
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
        const profile = normalizeProfile(snap.data(), uid, userData);
        writeCache(uid, profile);
        return profile;
    }

    const initialProfile = createDefaultProfile(uid, userData);
    await setDoc(profileRef, initialProfile, { merge: true });
    writeCache(uid, initialProfile);
    return initialProfile;
}

export async function updateStudentProfile(uid, updates = {}) {
    if (!uid) return null;
    const profileRef = doc(db, 'students', uid);
    const payload = {
        ...updates,
        updatedAt: serverTimestamp(),
    };

    await setDoc(profileRef, payload, { merge: true });
    const fresh = await getStudentProfile(uid, { force: true });
    const merged = { ...(fresh || {}), ...updates, updatedAt: new Date() };
    writeCache(uid, merged);
    return merged;
}

export async function addStudentBookmark(uid, resource) {
    const profile = await getStudentProfile(uid, { force: true });
    const bookmarks = Array.isArray(profile?.bookmarks) ? profile.bookmarks : [];
    const next = bookmarks.some((item) => item.id === resource.id) ? bookmarks : [...bookmarks, resource];
    await updateStudentProfile(uid, { bookmarks: next });
    return next;
}

export async function addStudentCourse(uid, course) {
    const profile = await getStudentProfile(uid, { force: true });
    const currentCourses = Array.isArray(profile?.currentCourses) ? profile.currentCourses : [];
    const next = currentCourses.some((item) => item.id === course.id) ? currentCourses : [...currentCourses, course];
    await updateStudentProfile(uid, { currentCourses: next });
    return next;
}

export async function markCourseCompleted(uid, courseId, title) {
    const profile = await getStudentProfile(uid, { force: true });
    const completed = Array.isArray(profile?.completedCourses) ? profile.completedCourses : [];
    const nextCompleted = completed.some((item) => item.id === courseId) ? completed : [...completed, { id: courseId, title }];
    const nextCurrent = (profile?.currentCourses || []).filter((item) => item.id !== courseId);
    await updateStudentProfile(uid, {
        completedCourses: nextCompleted,
        currentCourses: nextCurrent,
        xp: Number(profile?.xp || 0) + 120,
        level: Math.floor((Number(profile?.xp || 0) + 120) / 400) + 1,
        currentStreak: Number(profile?.currentStreak || 0) + 1,
    });
    return nextCompleted;
}

export async function logStudentEvent(uid, eventType, payload = {}) {
    if (!uid) return null;
    const eventRef = collection(db, 'student_timeline', uid, 'events');
    const event = {
        eventType,
        payload,
        createdAt: serverTimestamp(),
    };
    await addDoc(eventRef, event);
    await updateStudentProfile(uid, {
        lastLogin: serverTimestamp(),
    });
    return event;
}

export async function appendProfessorMemory(uid, message, role = 'student') {
    const profile = await getStudentProfile(uid, { force: true });
    const memory = profile?.professorMemory || {
        conversations: [],
        favouriteSubjects: [],
        weakTopics: [],
        strongTopics: [],
        studySchedule: [],
        personalGoals: []
    };
    const conversations = [...(memory.conversations || []), { role, message, createdAt: new Date().toISOString() }].slice(-12);
    await updateStudentProfile(uid, {
        professorMemory: {
            ...memory,
            conversations,
        },
    });
    return conversations;
}

export async function getStudentIntelligenceSnapshot(uid) {
    const profile = await getStudentProfile(uid, { force: true });
    return {
        profile,
        welcomeLabel: profile?.studentName ? `Welcome back ${profile.studentName.split(' ')[0]}` : 'Welcome back',
        todayGoal: profile?.learningGoals?.[0] || 'Complete one focused study block',
        nextRecommendation: profile?.interests?.[0] || 'Leadership',
    };
}

export function getCachedStudentProfile(uid) {
    return readCache(uid) || readLocalStorage(uid);
}

export function clearStudentProfileCache(uid) {
    profileCache.delete(uid);
    if (typeof localStorage !== 'undefined' && uid) {
        localStorage.removeItem(`${STORAGE_PREFIX}${uid}`);
    }
}

export default {
    getStudentProfile,
    ensureStudentProfile,
    updateStudentProfile,
    addStudentBookmark,
    addStudentCourse,
    markCourseCompleted,
    logStudentEvent,
    appendProfessorMemory,
    getStudentIntelligenceSnapshot,
    getCachedStudentProfile,
    clearStudentProfileCache,
};
