import { initAuthListener, getCurrentUser, logoutUser, getUserProfile } from './auth.js';

const studentName = document.getElementById('student-name');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileCountry = document.getElementById('profile-country');
const profileGoal = document.getElementById('profile-goal');
const statsContainer = document.getElementById('dashboard-stats');
const coursesContainer = document.getElementById('dashboard-courses');
const focusSummary = document.getElementById('focus-summary');
const focusPill = document.getElementById('focus-pill');
const logoutButton = document.getElementById('logout-button');
const navLogin = document.getElementById('nav-login');
const navLogout = document.getElementById('nav-logout');
const viewCourses = document.getElementById('view-courses');
const mentorForm = document.getElementById('mentor-form');
const mentorInput = document.getElementById('mentor-input');
const mentorMessages = document.getElementById('mentor-messages');
const mentorChips = document.querySelectorAll('.mentor-chip');

const COURSES = [
    { id: 1, icon: '🌐', title: 'AI for Everyday Leadership', duration: '12 Weeks', progress: 35, category: 'Leadership' },
    { id: 2, icon: '🐍', title: 'Python for Social Impact', duration: '10 Weeks', progress: 20, category: 'AI Education' },
    { id: 3, icon: '🧠', title: 'Communication & Community Care', duration: '14 Weeks', progress: 10, category: 'Community Development' }
];

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
        created: profile.createdAt?.seconds ? new Date(profile.createdAt.seconds * 1000).toISOString() : profile.created || new Date().toISOString()
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
    if (!student) return;
    studentName.textContent = student.name || 'Warrior';
    profileName.textContent = student.name || '—';
    profileEmail.textContent = student.email || '—';
    profileCountry.textContent = student.country || '—';
    profileGoal.textContent = student.goal || '—';
}

function renderStats(student) {
    if (!statsContainer) return;
    const enrolledCount = COURSES.length;
    const streak = student?.learningStreak || 3;
    const totalHours = Math.max(6, Math.round((student?.progress || 0) / 10) + 6);
    const badges = student?.certificateCount || 4;

    statsContainer.innerHTML = `
        <div class="stat-pill"><div class="number">${enrolledCount}</div><div class="label">Enrolled</div></div>
        <div class="stat-pill"><div class="number">${streak}</div><div class="label">Day Streak</div></div>
        <div class="stat-pill"><div class="number">${totalHours}h</div><div class="label">Study Time</div></div>
        <div class="stat-pill"><div class="number">${badges}</div><div class="label">Badges</div></div>
    `;
}

function renderFocus(student) {
    if (!focusSummary || !focusPill) return;
    const nextStep = student?.currentCourse || 'AI Foundations';
    const dailyGoal = student?.daily || 30;
    focusSummary.textContent = `Continue ${nextStep.toLowerCase()} and aim for ${dailyGoal} minutes of focused study today.`;
    focusPill.textContent = nextStep;
}

function renderCourses(student) {
    if (!coursesContainer) return;

    const personalizedCourses = COURSES.map((course, index) => {
        const progress = Math.min(100, Math.max(course.progress, (student?.progress || 0) / 3 + index * 5));
        return `
            <div class="course-card">
                <div class="icon">${course.icon}</div>
                <h3>${course.title}</h3>
                <p class="course-desc">${course.category} • ${course.duration} • ${Math.round(progress)}% complete</p>
                <div class="progress-bar"><div class="fill" style="width:${Math.round(progress)}%"></div></div>
                <button type="button" class="btn-sm enrolled">Continue</button>
            </div>
        `;
    });

    coursesContainer.innerHTML = personalizedCourses.join('');
}

function createMessage(text, type = 'bot') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `<strong>${type === 'bot' ? 'Mentor' : 'You'}</strong><p>${text}</p>`;
    return message;
}

function appendMessage(text, type = 'bot') {
    if (!mentorMessages) return;
    mentorMessages.appendChild(createMessage(text, type));
    mentorMessages.scrollTop = mentorMessages.scrollHeight;
}

function getMentorReply(message) {
    const lower = message.toLowerCase();

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

function initMentorPanel() {
    if (!mentorForm || !mentorInput) return;

    mentorForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = mentorInput.value.trim();
        if (!input) return;

        appendMessage(input, 'user');
        mentorInput.value = '';

        window.setTimeout(() => {
            appendMessage(getMentorReply(input), 'bot');
        }, 350);
    });

    mentorChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            const prompt = chip.dataset.prompt || chip.textContent.trim();
            mentorInput.value = prompt;
            mentorInput.focus();
        });
    });
}

function setAuthVisibility(loggedIn) {
    if (navLogin) navLogin.style.display = loggedIn ? 'none' : 'inline-flex';
    if (navLogout) navLogout.classList.toggle('hidden', !loggedIn);
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
    renderFocus(student);
    renderCourses(student);
    initMentorPanel();
    setAuthVisibility(true);

    initAuthListener((user) => {
        if (!user) {
            signOut();
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', signOut);
    }

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
