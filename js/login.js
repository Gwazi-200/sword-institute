import { loginUser } from './js/auth.js';
import { showToast, clearToasts, showLoading, hideLoading, setFormDisabled } from './js/ui.js';

const form = document.getElementById('login-form');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const submitBtn = document.getElementById('login-submit');

function createStudentPayload(user) {
    return {
        uid: user.uid,
        email: user.email,
        name: user.fullName || user.displayName || user.email.split('@')[0],
        phone: user.phone || user.phoneNumber || '',
        country: user.country || '',
        goal: user.preferences?.preferredTime || 'career',
        daily: user.preferences?.dailyStudyGoal || 30,
        created: user.createdAt ? new Date(user.createdAt.seconds * 1000).toISOString() : new Date().toISOString()
    };
}

function redirectToDashboard() {
    window.location.href = './dashboard.html';
}

function loadSession() {
    const stored = localStorage.getItem('sword_student');
    return stored ? JSON.parse(stored) : null;
}

if (loadSession()) {
    redirectToDashboard();
}

if (form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearToasts();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showToast('Please enter both email and password.', 'warning');
            return;
        }

        setFormDisabled(form, true);
        showLoading(submitBtn, 'Signing in...');

        try {
            const user = await loginUser(email, password);
            const studentData = createStudentPayload(user);
            localStorage.setItem('sword_student', JSON.stringify(studentData));
            showToast('Welcome back! Redirecting to dashboard...', 'success', 3000);
            setTimeout(redirectToDashboard, 1200);
        } catch (error) {
            showToast(error.message || 'Login failed. Please try again.', 'error');
            setFormDisabled(form, false);
        } finally {
            hideLoading(submitBtn);
        }
    });
}
