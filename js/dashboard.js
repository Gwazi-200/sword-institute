import { initAuthListener, getCurrentUser, logoutUser } from './js/auth.js';
import { showToast } from './js/ui.js';

const studentName = document.getElementById('student-name');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileCountry = document.getElementById('profile-country');
const profileGoal = document.getElementById('profile-goal');
const statsContainer = document.getElementById('dashboard-stats');
const coursesContainer = document.getElementById('dashboard-courses');
const logoutButton = document.getElementById('logout-button');
const navLogin = document.getElementById('nav-login');
const navLogout = document.getElementById('nav-logout');
const viewCourses = document.getElementById('view-courses');

const COURSES = [
    { id: 1, icon: '🌐', title: 'Web Alchemy', duration: '12 Weeks', progress: 35 },
    { id: 2, icon: '🐍', title: 'Python Pathways', duration: '10 Weeks', progress: 20 },
    { id: 3, icon: '🧠', title: 'AI & Consciousness', duration: '14 Weeks', progress: 10 }
];

function loadStudent() {
    const data = localStorage.getItem('sword_student');
    if (data) {
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    const current = getCurrentUser();
    if (current) {
        return {
            uid: current.uid,
            email: current.email,
            name: current.fullName || current.displayName || current.email.split('@')[0],
            phone: current.phone || '',
            country: current.country || '',
            goal: current.preferences?.preferredTime || 'career',
            daily: current.preferences?.dailyStudyGoal || 30,
            created: current.createdAt ? new Date(current.createdAt.seconds * 1000).toISOString() : new Date().toISOString()
        };
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
    const streak = 3;
    const totalHours = 12;

    statsContainer.innerHTML = `
        <div class="stat-pill"><div class="number">${enrolledCount}</div><div class="label">Enrolled</div></div>
        <div class="stat-pill"><div class="number">${streak}</div><div class="label">Day Streak</div></div>
        <div class="stat-pill"><div class="number">${totalHours}h</div><div class="label">Study Time</div></div>
        <div class="stat-pill"><div class="number">4</div><div class="label">Badges</div></div>
    `;
}

function renderCourses() {
    if (!coursesContainer) return;
    coursesContainer.innerHTML = COURSES.map(course => `
        <div class="course-card">
            <div class="icon">${course.icon}</div>
            <h3>${course.title}</h3>
            <p class="course-desc">${course.duration} • ${course.progress}% complete</p>
            <div class="progress-bar"><div class="fill" style="width:${course.progress}%"></div></div>
            <button type="button" class="btn-sm enrolled" disabled>Continue</button>
        </div>
    `).join('');
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

function init() {
    const student = loadStudent();
    if (!student) {
        window.location.href = './login.html';
        return;
    }

    renderProfile(student);
    renderStats(student);
    renderCourses();
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
