import { db, collection, getDocs, doc, getDoc, query, where, orderBy, limit } from '../firebase.js';

const DASHBOARD_CACHE = new Map();
const CACHE_TTL_MS = 45000;

function getCacheKey(uid) {
    return `dashboard:${uid}`;
}

function getCachedDashboard(uid) {
    const key = getCacheKey(uid);
    const cached = DASHBOARD_CACHE.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        DASHBOARD_CACHE.delete(key);
        return null;
    }
    return cached.value;
}

function setCachedDashboard(uid, value) {
    DASHBOARD_CACHE.set(getCacheKey(uid), { value, timestamp: Date.now() });
}

async function fetchDashboardData(uid) {
    if (!uid) return null;

    const cached = getCachedDashboard(uid);
    if (cached) return cached;

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};

    const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('userId', '==', uid),
        where('status', '==', 'active')
    );
    const enrollmentsSnap = await getDocs(enrollmentsQuery);
    const enrollments = enrollmentsSnap.docs.map((item) => ({ id: item.id, ...item.data() }));

    const courseIds = enrollments.map((item) => item.courseId).filter(Boolean);
    const courseData = [];

    if (courseIds.length > 0) {
        const courseQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds.slice(0, 10)));
        const courseSnap = await getDocs(courseQuery);
        courseSnap.forEach((courseDoc) => {
            courseData.push({ id: courseDoc.id, ...courseDoc.data() });
        });
    }

    const dashboardModel = {
        user: userData,
        enrollments,
        courses: courseData,
        stats: {
            activeCourses: enrollments.length,
            completedCourses: enrollments.filter((item) => item.completed).length,
            totalXp: enrollments.reduce((sum, item) => sum + (Number(item.xpEarned) || 0), 0),
            streak: Number(userData.learningStreak) || 3,
            certificates: Number(userData.certificatesCount) || 0
        },
        welcome: {
            title: 'Welcome back',
            name: userData.displayName || userData.name || 'Learner',
            subtitle: 'Your learning command center is ready.'
        }
    };

    setCachedDashboard(uid, dashboardModel);
    return dashboardModel;
}

async function refreshDashboardData(uid) {
    DASHBOARD_CACHE.delete(getCacheKey(uid));
    return fetchDashboardData(uid);
}

export { fetchDashboardData, refreshDashboardData };
export default { fetchDashboardData, refreshDashboardData };