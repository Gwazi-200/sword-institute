import { initAuthListener, getCurrentUser, logoutUser, getUserProfile } from './auth.js';

// NOTE:
// This file is a patched version of js/dashboard.js that matches the DOM in dashboard.html.
// It prevents null dereference crashes by guarding element access and by using the correct IDs.

const el = (id) => document.getElementById(id);

// Header/profile elements that exist in dashboard.html
const studentNameHeader = el('student-name');
const studentNameHero = el('student-name-hero');

// Stats/cards exist in dashboard.html
const coursesEnrolled = el('courses-enrolled');
const learningProgress = el('learning-progress'); // text like "68%"
const certificatesEarned = el('certificates-earned');
const warriorStreak = el('warrior-streak');
const learningHours = el('learning-hours');
const communityScore = el('community-score');

// Focus summary elements (not present in dashboard.html; keep guarded)
const focusSummary = el('focus-summary');
const focusPill = el('focus-pill');

// Courses container used by legacy js/dashboard.js (not present in dashboard.html)
const coursesContainer = el('dashboard-courses');

// Logout / nav elements
const navLogin = el('nav-login'); // not present in dashboard.html
const navLogout = el('nav-logout');
const viewCourses = el('view-courses'); // not present in dashboard.html

// Mentor panel elements in dashboard.html
const mentorForm = el('mentor-form'); // not present
const mentorInput = el('mentor-input'); // not present
const mentorMessages = el('mentor-messages'); // not present
const mentorChips = document.querySelectorAll('.mentor-chip'); // not present (dashboard.html uses different IDs)

const askAiBtn = el('ask-ai-btn');
const refreshMentorBtn = el('refresh-mentor-btn');
const mentorGreeting = el('mentor-greeting');
const mentorMessage = el('mentor-message');
const mentorTip = el('mentor-tip');
const mentorNews = el('mentor-news');
const mentorDate = el('mentor-date');

const COURSES = [
    { id: 1, icon: '🌐', title: 'AI for Everyday Leadership', duration: '12 Weeks', progress: 35, category: 'Leadership' },
    { id: 2, icon: '🐍', title: 'Python for Social Impact', duration: '10 Weeks', progress: 20, category: 'AI Education' },
    { id: 3, icon: '🧠', title: 'Communication & Community Care', duration: '14 Weeks', progress: 10, category: 'Community Development' }
];

function safeText(node, value, fallback = '—') {
    if (!node) return;
    node.textContent = value ?? fallback;
}

function normalizeStudent(rawStudent) {
    if (!rawStudent) return null;

    const profile = typeof rawStudent === 'string' ? JSON.parse(rawStudent) : rawStudent;
    const fullName = profile.fullName || profile.name || profile.displayName || profile.email?.split('@')[0] || 'Warrior';

    return {
        uid: profile.uid || profile.id || '',
        email: profile.email || '',
        name: fullName,
        phone: profile.phone || '',
        country: profile.country || '',
        goal: profile.goal || profile.preferences?.preferredTime || profile.studyGoal || 'career growth',
        daily: profile.daily || profile.preferences?.dailyStudyGoal || 30,
        learningStreak: profile.learningStreak || 3,
        progress: profile.progress || 0,
        completedCourses: profile.coursesCompleted || 0,
        certificateCount: profile.certificateCount || 0,
        currentCourse: profile.currentCourse || 'AI Foundations',
        created: profile.createdAt?.seconds
            ? new Date(profile.createdAt.seconds * 1000).toISOString()
            : profile.created || new Date().toISOString()
    };
}

async function loadStudent() {
    const storedData = localStorage.getItem('sword_student');
    if (storedData) {
        try {
            const parsed = normalizeStudent(JSON.parse(storedData));
            if (parsed) return parsed;
        } catch {
            localStorage.removeItem('sword_student');
        }
    }

    const current = getCurrentUser();
    if (current?.uid) {
        try {
            const profile = await getUserProfile(current.uid);
            const merged = normalizeStudent({ ...current, ...profile });
            if (merged) {
                localStorage.setItem('sword_student', JSON.stringify(merged));
                return merged;
            }
        } catch (error) {
            console.warn('Unable to load Firestore profile:', error);
        }

        return normalizeStudent({
            uid: current.uid,
            email: current.email,
            fullName: current.fullName || current.displayName || current.email?.split('@')[0],
            country: current.country || '',
            phone: current.phone || '',
            preferences: current.preferences || {}
        });
    }

    return null;
}

function renderProfile(student) {
    safeText(studentNameHeader, student.name || 'Warrior');
    safeText(studentNameHero, student.name || 'Warrior');
}

function renderStats(student) {
    // Use dashboard.html section values if present; otherwise do nothing.
    const enrolledCount = COURSES.length;
    const streak = student?.learningStreak || 3;
    const progressPct = Math.min(100, Math.max(0, Math.round(student?.progress || 0)));
    const badges = student?.certificateCount || 4;
    const totalHours = Math.max(6, Math.round((student?.progress || 0) / 10) + 6);

    safeText(coursesEnrolled, String(enrolledCount));
    safeText(learningProgress, `${progressPct}%`);
    safeText(certificatesEarned, String(badges));
    safeText(warriorStreak, String(streak));
    safeText(learningHours, String(totalHours));

    // Community score isn't in student model; keep default/derived
    const comm = student?.communityScore ?? (student?.progress ? Math.round(student.progress * 0.8) : 142);
    safeText(communityScore, String(comm));

    // Optional: update <progress> bars if those exist.
    const missionProg = el('mission-progress');
    const learningProgBar = document.querySelector('progress[aria-label="Learning progress"]');
    const certProgBar = document.querySelector('progress[aria-label="Certificates progress"]');
    const streakProgBar = document.querySelector('progress[aria-label="Streak progress"]');
    const hoursProgBar = document.querySelector('progress[aria-label="Hours progress"]');
    const commProgBar = document.querySelector('progress[aria-label="Community progress"]');

    if (missionProg) missionProg.value = Math.min(100, Math.max(0, progressPct));
    if (learningProgBar) learningProgBar.value = Math.min(100, Math.max(0, progressPct));
    if (certProgBar) certProgBar.value = Math.min(10, Math.max(0, badges));
    if (streakProgBar) streakProgBar.value = Math.min(30, Math.max(0, streak));
    if (hoursProgBar) hoursProgBar.value = Math.min(150, Math.max(0, totalHours));
    if (commProgBar) commProgBar.value = Math.min(200, Math.max(0, comm));
}

function getMentorReply(message) {
    const lower = (message || '').toLowerCase();

    if (lower.includes('plan') || lower.includes('week')) {
        return 'A strong weekly plan is to focus on one skill at a time, review notes once a day, and finish with one small action that builds momentum.';
    }
    if (lower.includes('lead') || lower.includes('leadership')) {
        return 'Leadership grows through practice. Start by communicating clearly, listening carefully, and taking one thoughtful action that helps your team or community.';
    }
    if (lower.includes('community') || lower.includes('care')) {
        return 'Community-focused work benefits from empathy and consistency. Choose one local need and turn it into a small, practical step this week.';
    }
    if (lower.includes('ai')) {
        return 'AI is most useful when paired with responsibility. Focus on the goal, verify the result, and apply it ethically for real-world impact.';
    }
    if (lower.includes('study') || lower.includes('learn')) {
        return 'A simple study rhythm is 25 minutes of focused attention, 5 minutes of review, and one short reflection on what you understood.';
    }

    return 'That is a thoughtful goal. I recommend breaking it into one small milestone, then reviewing your progress after a focused practice session.';
}

function setMentorMessage(text) {
    if (mentorMessage) mentorMessage.textContent = `"${text}"`;
}

function setMentorTip(text) {
    if (mentorTip) mentorTip.textContent = text;
}

function setMentorGreeting(name) {
    if (mentorGreeting) mentorGreeting.textContent = `Good afternoon, ${name || 'Warrior'}!`;
}

function initMentorUI(student) {
    // dashboard.html uses simple buttons and placeholders; wire them to update the placeholders.
    const name = student?.name || 'Warrior';
    setMentorGreeting(name);

    const defaultTip = 'Daily tip: Practice active recall for 10 minutes.';
    setMentorTip(defaultTip);

    const defaultMsg = mentorMessage?.textContent?.trim() || 'You are making remarkable progress. Keep pushing your limits.';

    if (askAiBtn) {
        askAiBtn.addEventListener('click', () => {
            const prompt = `Help me with ${student?.currentCourse || 'my learning plan'}. Give me a short actionable step.`;
            setMentorMessage(getMentorReply(prompt));
        });
    }

    if (refreshMentorBtn) {
        refreshMentorBtn.addEventListener('click', () => {
            setMentorMessage(defaultMsg.replace(/^"|"$/g, ''));
            setMentorTip(defaultTip);
        });
    }

    // mentor date/tabs are static in HTML; no-op.
    if (mentorNews && !mentorNews.textContent) {
        if (student?.currentCourse) mentorNews.textContent = `Latest: ${student.currentCourse} updates available.`;
    }
}

function setAuthVisibility() {
    // dashboard.html has logout link ONLY: #logout-btn
    // Avoid toggling nav-login/nav-logout (not present) to prevent UI inconsistencies.
    attachLogoutHandler();
}



function attachLogoutHandler() {
    // dashboard.html logout link id is "logout-btn".
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;

    // Avoid double-binding: remove existing handler by cloning.
    const cloned = logoutBtn.cloneNode(true);
    logoutBtn.replaceWith(cloned);

    cloned.addEventListener('click', (e) => {
        e.preventDefault();
        signOut();
    });
}

async function signOut() {

    try {
        await logoutUser();
    } catch (error) {
        console.warn('Logout failed, clearing local session anyway.');
    } finally {
        localStorage.removeItem('sword_student');
        window.location.href = './login.html';
    }
}

async function init() {
    const student = await loadStudent();
    if (!student) {
        window.location.href = './login.html';
        return;
    }

    renderProfile(student);
    renderStats(student);
    if (focusSummary && focusPill) {
        const nextStep = student?.currentCourse || 'AI Foundations';
        const dailyGoal = student?.daily || 30;
        focusSummary.textContent = `Continue ${nextStep.toLowerCase()} and aim for ${dailyGoal} minutes of focused study today.`;
        focusPill.textContent = nextStep;
    }

    initMentorUI(student);
    setAuthVisibility();

    initAuthListener((user) => {
        if (!user) signOut();
    });

    if (navLogout) {
        navLogout.addEventListener('click', (e) => {
            // prevent hash routing
            e.preventDefault();
            signOut();
        });
    }

    // Courses container not used by dashboard.html; ignore legacy viewCourses.
    if (viewCourses) {
        viewCourses.addEventListener('click', () => {
            window.location.href = './courses.html';
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

