// dashboard.js – Sword Institute LMS
// ES Module – imports from unified firebase.js
import { auth, onAuthStateChanged, signOut } from './firebase.js';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    // Auth listener
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
            return;
        }
        // User is logged in – populate dashboard
        populateUserInfo(user);
        initDashboard();
    });

    // Logout handler
    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Logout error:', error);
        });
    });
});

// Populate user info (name, email, avatar)
function populateUserInfo(user) {
    const displayName = user?.displayName || 'Student';
    const email = user?.email || 'student@sword.institute';
    const photoURL = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7C3AED&color=fff&size=80`;

    // Update all name placeholders
    document.querySelectorAll('#studentNameHeader, #studentNameHero, #profileName').forEach(el => {
        if (el) el.textContent = displayName;
    });

    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');
    const studentAvatar = document.getElementById('studentAvatar');
    const profileCountry = document.getElementById('profileCountry');
    const profileGoal = document.getElementById('profileGoal');
    const profileLevel = document.getElementById('profileLevel');

    if (profileEmail) profileEmail.textContent = email;
    if (profileAvatar) profileAvatar.src = photoURL;
    if (studentAvatar) studentAvatar.src = photoURL;

    // Set additional profile placeholders (could be from Firestore later)
    // For now, static values
    if (profileCountry) profileCountry.textContent = 'Kenya';
    if (profileGoal) profileGoal.textContent = 'Master AI for Social Good';
    if (profileLevel) profileLevel.textContent = 'Gold Warrior';
}


// Initialize dashboard (load courses, announcements, Professor SWORD, etc.)
function initDashboard() {
    // Set current date
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    // --- Courses data ---
    const courses = [
        { title: 'Communication Skills', category: 'Soft Skills', duration: '3h', difficulty: 'Beginner', progress: 75, image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Communication' },
        { title: 'Administration & Management', category: 'Business', duration: '4h', difficulty: 'Intermediate', progress: 40, image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Admin' },
        { title: 'Entrepreneurship', category: 'Business', duration: '2.5h', difficulty: 'Beginner', progress: 90, image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Entrepreneurship' },
        { title: 'Community Based Organisations', category: 'Development', duration: '3h', difficulty: 'Intermediate', progress: 65, image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=CBO' },
        { title: 'AI Basic Education', category: 'Technology', duration: '5h', difficulty: 'Advanced', progress: 25, image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=AI+Basic' },
        { title: 'Child Welfare Programmes', category: 'Social Work', duration: '4h', difficulty: 'Intermediate', progress: 55, image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Child+Welfare' },
        { title: 'Psychosocial Support', category: 'Mental Health', duration: '3.5h', difficulty: 'Beginner', progress: 30, image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Psychosocial' },
        { title: 'Home Based Care', category: 'Health', duration: '2h', difficulty: 'Beginner', progress: 80, image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Home+Care' }
    ];

    const coursesGrid = document.getElementById('coursesGrid');
    coursesGrid.innerHTML = '';
    courses.forEach(c => {
        const card = document.createElement('div');
        card.className = 'course-card glass';
        card.innerHTML = `
            <img src="${c.image}" alt="${c.title}" loading="lazy" />
            <h3>${c.title}</h3>
            <div class="meta"><span>${c.category}</span><span>${c.duration}</span><span>${c.difficulty}</span></div>
            <div class="progress-wrap">
                <progress value="${c.progress}" max="100"></progress>
                <span>${c.progress}%</span>
            </div>
            <button class="btn-continue" data-course="${c.title}">Continue Learning</button>
        `;
        coursesGrid.appendChild(card);
    });

    // Add event listeners to continue buttons (optional)
    document.querySelectorAll('.btn-continue').forEach(btn => {
        btn.addEventListener('click', function() {
            alert(`Resuming: ${this.dataset.course}`);
        });
    });

    // --- Professor SWORD Messages Rotation ---
    const mentorMessages = [
        { greeting: 'Hello, Warrior!', message: 'You are making incredible progress.', tip: '💡 Focus on one concept at a time.', advice: '📈 Consider learning Python for AI.', quote: '“The future belongs to those who learn more.”' },
        { greeting: 'Good day, Champion!', message: 'Keep up the momentum!', tip: '💡 Practice coding daily.', advice: '📈 Attend AI workshops to network.', quote: '“Education is the most powerful weapon.”' },
        { greeting: 'Hey, Leader!', message: 'Your dedication is inspiring.', tip: '💡 Teach others to reinforce learning.', advice: '📈 Explore open-source AI projects.', quote: '“Success is not final; failure is not fatal.”' },
        { greeting: 'Greetings, Visionary!', message: 'You are on the path to mastery.', tip: '💡 Set weekly learning goals.', advice: '📈 Build a portfolio of projects.', quote: '“The only limit is your imagination.”' },
    ];

    let mentorIndex = 0;
    const mentorGreetingEl = document.getElementById('mentorGreeting');
    const mentorMessageEl = document.getElementById('mentorMessage');
    const mentorTipEl = document.getElementById('mentorTip');
    const mentorAdviceEl = document.getElementById('mentorAdvice');
    const mentorQuoteEl = document.getElementById('mentorQuote');

    function rotateMentor() {
        const msg = mentorMessages[mentorIndex % mentorMessages.length];
        if (mentorGreetingEl) mentorGreetingEl.textContent = msg.greeting;
        if (mentorMessageEl) mentorMessageEl.textContent = msg.message;
        if (mentorTipEl) mentorTipEl.textContent = msg.tip;
        if (mentorAdviceEl) mentorAdviceEl.textContent = msg.advice;
        if (mentorQuoteEl) mentorQuoteEl.textContent = msg.quote;
        mentorIndex++;
    }

    rotateMentor();

    setInterval(rotateMentor, 10000); // rotate every 10 seconds

    // --- Animate progress bars (optional) ---
    // The progress elements already have values; we can add a fade-in effect via CSS.
    // We can also animate the circular progress – but we set it statically in HTML.

    // --- Sidebar toggle for mobile ---
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Additional: set hero stats, etc. (placeholders already)
    // Could fetch from Firestore later.
}