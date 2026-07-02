// course-catalog.js – Sword Institute Course Catalogue
// ES Module – imports from firebase.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

let allCourses = [];
let filteredCourses = [];
let currentCategory = 'all';
let currentDifficulty = 'all';
let searchTerm = '';

document.addEventListener('DOMContentLoaded', () => {
    // Auth listener
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        // User logged in
        populateUserInfo(user);
        loadCourses();
        setupEventListeners();
        setCurrentDate();
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        }).catch(console.error);
    });
});

function populateUserInfo(user) {
    const name = user.displayName || 'Student';
    const photo = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7C3AED&color=fff&size=80`;
    document.getElementById('studentAvatar').src = photo;
    // Could also update welcome text
}

function setCurrentDate() {
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

async function loadCourses() {
    try {
        const coursesRef = collection(db, 'courses');
        const snapshot = await getDocs(coursesRef);
        allCourses = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            // Ensure progress and rating exist
            data.progress = data.progress || 0;
            data.rating = data.rating || 0;
            allCourses.push(data);
        });
        // Update total courses count
        document.getElementById('totalCourses').textContent = allCourses.length;
        // Calculate average rating
        const totalRating = allCourses.reduce((sum, c) => sum + c.rating, 0);
        const avg = allCourses.length ? (totalRating / allCourses.length).toFixed(1) : 0;
        document.getElementById('avgRating').textContent = avg;
        // Update stats (placeholder - could be from user data)
        // For now, set static stats or calculate from courses
        document.getElementById('statEnrolled').textContent = allCourses.length;
        document.getElementById('statCompleted').textContent = allCourses.filter(c => c.progress >= 100).length;
        document.getElementById('statHours').textContent = allCourses.reduce((sum, c) => sum + (c.duration || 0), 0);
        document.getElementById('statCertificates').textContent = allCourses.filter(c => c.certificateAvailable).length || 3;

        // Apply filters and render
        applyFilters();
        renderContinueLearning();
        renderRecommended();
        renderPopularCarousel();
    } catch (error) {
        console.error('Error loading courses:', error);
        // Fallback: use sample data for demo
        useSampleData();
    }
}

function useSampleData() {
    // Sample data if Firestore fails
    allCourses = [
        { id: '1', title: 'Communication Skills', category: 'professional', difficulty: 'beginner', duration: 3, rating: 4.5, progress: 75, instructor: 'Dr. Jane', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Communication', description: 'Master effective communication.' },
        { id: '2', title: 'Administration & Management', category: 'professional', difficulty: 'intermediate', duration: 4, rating: 4.2, progress: 40, instructor: 'Mr. Smith', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Admin', description: 'Learn administration skills.' },
        { id: '3', title: 'AI Basic Education', category: 'ai', difficulty: 'advanced', duration: 5, rating: 4.8, progress: 25, instructor: 'Dr. Khan', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=AI', description: 'Introduction to AI.' },
        { id: '4', title: 'Community Based Organisations', category: 'community', difficulty: 'intermediate', duration: 3, rating: 4.0, progress: 65, instructor: 'Mr. Omar', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=CBO', description: 'Manage CBOs effectively.' },
        { id: '5', title: 'Child Welfare Programmes', category: 'community', difficulty: 'beginner', duration: 4, rating: 4.7, progress: 55, instructor: 'Ms. Aisha', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Child+Welfare', description: 'Child welfare practices.' },
        { id: '6', title: 'Psychosocial Support', category: 'wellbeing', difficulty: 'beginner', duration: 3.5, rating: 4.3, progress: 30, instructor: 'Dr. Patel', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Psychosocial', description: 'Support mental health.' },
        { id: '7', title: 'Home Based Care', category: 'wellbeing', difficulty: 'beginner', duration: 2, rating: 4.1, progress: 80, instructor: 'Nurse Grace', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Home+Care', description: 'Home care basics.' },
        { id: '8', title: 'Entrepreneurship', category: 'professional', difficulty: 'beginner', duration: 2.5, rating: 4.6, progress: 90, instructor: 'Prof. Lee', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Entrepreneurship', description: 'Start your own business.' },
    ];
    document.getElementById('totalCourses').textContent = allCourses.length;
    const totalRating = allCourses.reduce((sum, c) => sum + c.rating, 0);
    document.getElementById('avgRating').textContent = (totalRating / allCourses.length).toFixed(1);
    document.getElementById('statEnrolled').textContent = allCourses.length;
    document.getElementById('statCompleted').textContent = allCourses.filter(c => c.progress >= 100).length;
    document.getElementById('statHours').textContent = allCourses.reduce((sum, c) => sum + (c.duration || 0), 0);
    document.getElementById('statCertificates').textContent = 3;
    applyFilters();
    renderContinueLearning();
    renderRecommended();
    renderPopularCarousel();
}

function applyFilters() {
    filteredCourses = allCourses.filter(course => {
        // Category filter
        if (currentCategory !== 'all' && course.category !== currentCategory) return false;
        // Difficulty filter
        if (currentDifficulty !== 'all' && course.difficulty !== currentDifficulty) return false;
        // Search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const match = course.title.toLowerCase().includes(term) ||
                          course.description?.toLowerCase().includes(term) ||
                          course.instructor?.toLowerCase().includes(term);
            if (!match) return false;
        }
        return true;
    });
    renderCourses(filteredCourses);
}

function renderCourses(courses) {
    const grid = document.getElementById('courseGrid');
    if (!grid) return;
    grid.innerHTML = '';
    if (courses.length === 0) {
        grid.innerHTML = '<p class="no-results">No courses match your filters. Try adjusting your search.</p>';
        return;
    }
    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card glass';
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.innerHTML = `
            <img src="${course.image || 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Course'}" alt="${course.title}" loading="lazy" />
            <h3>${course.title}</h3>
            <div class="meta">
                <span><i class="fas fa-user"></i> ${course.instructor || 'Instructor'}</span>
                <span class="rating"><i class="fas fa-star"></i> ${course.rating || 0}</span>
                <span><i class="fas fa-clock"></i> ${course.duration || 0}h</span>
                <span class="badge">${course.difficulty || 'Beginner'}</span>
            </div>
            <div class="progress-wrap">
                <progress value="${course.progress || 0}" max="100"></progress>
                <span>${course.progress || 0}%</span>
            </div>
            <button class="btn-detail" data-id="${course.id}">View Details</button>
        `;
        grid.appendChild(card);
        // Animate in
        requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.5s, transform 0.5s';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
        // Event listener for detail
        card.querySelector('.btn-detail').addEventListener('click', () => openModal(course));
    });
}

function renderContinueLearning() {
    const grid = document.getElementById('continueGrid');
    const continueCourses = allCourses.filter(c => c.progress > 0 && c.progress < 100).slice(0, 4);
    grid.innerHTML = '';
    if (continueCourses.length === 0) {
        grid.innerHTML = '<p>No courses in progress. Start learning today!</p>';
        return;
    }
    continueCourses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card glass';
        card.innerHTML = `
            <img src="${course.image || 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Course'}" alt="${course.title}" />
            <h3>${course.title}</h3>
            <div class="meta"><span>${course.instructor || ''}</span></div>
            <div class="progress-wrap">
                <progress value="${course.progress}" max="100"></progress>
                <span>${course.progress}%</span>
            </div>
            <button class="btn-detail" data-id="${course.id}">Continue</button>
        `;
        grid.appendChild(card);
        card.querySelector('.btn-detail').addEventListener('click', () => openModal(course));
    });
}

function renderRecommended() {
    const grid = document.getElementById('recommendedGrid');
    // For demo, recommend courses with high rating or incomplete
    const recommended = allCourses.filter(c => c.rating >= 4.0 && c.progress < 100).slice(0, 4);
    grid.innerHTML = '';
    if (recommended.length === 0) {
        grid.innerHTML = '<p>Check back later for recommendations.</p>';
        return;
    }
    recommended.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card glass';
        card.innerHTML = `
            <img src="${course.image || 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Course'}" alt="${course.title}" />
            <h3>${course.title}</h3>
            <div class="meta"><span>${course.instructor || ''}</span> <span class="rating"><i class="fas fa-star"></i> ${course.rating}</span></div>
            <button class="btn-detail" data-id="${course.id}">Learn More</button>
        `;
        grid.appendChild(card);
        card.querySelector('.btn-detail').addEventListener('click', () => openModal(course));
    });
}

function renderPopularCarousel() {
    const track = document.getElementById('carouselTrack');
    const popular = allCourses.filter(c => c.rating >= 4.5).slice(0, 8);
    track.innerHTML = '';
    if (popular.length === 0) {
        track.innerHTML = '<p>No popular courses yet.</p>';
        return;
    }
    popular.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card glass';
        card.style.minWidth = '200px';
        card.innerHTML = `
            <img src="${course.image || 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Course'}" alt="${course.title}" />
            <h3>${course.title}</h3>
            <div class="meta"><span class="rating"><i class="fas fa-star"></i> ${course.rating}</span></div>
            <button class="btn-detail" data-id="${course.id}">View</button>
        `;
        track.appendChild(card);
        card.querySelector('.btn-detail').addEventListener('click', () => openModal(course));
    });
}

// Modal
function openModal(course) {
    const modal = document.getElementById('courseModal');
    const body = document.getElementById('modalBody');
    body.innerHTML = `
        <img src="${course.image || 'https://placehold.co/600x300/7C3AED/FFFFFF?text=Course'}" alt="${course.title}" class="course-detail-img" />
        <h2>${course.title}</h2>
        <p>${course.description || 'No description available.'}</p>
        <div class="detail-meta">
            <span><i class="fas fa-user"></i> ${course.instructor || 'Instructor'}</span>
            <span><i class="fas fa-clock"></i> ${course.duration || 0}h</span>
            <span><i class="fas fa-star"></i> ${course.rating || 0}</span>
            <span><i class="fas fa-tag"></i> ${course.difficulty || 'Beginner'}</span>
            <span><i class="fas fa-chart-line"></i> Progress: ${course.progress || 0}%</span>
        </div>
        <button class="btn-detail" style="background: var(--primary); color: #fff; border: none; padding: 10px 24px; border-radius: 40px; cursor: pointer;">Continue Learning</button>
    `;
    modal.classList.add('active');
}

document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('courseModal').classList.remove('active');
});
document.getElementById('courseModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('courseModal').classList.remove('active');
    }
});

// Event listeners for search and filters
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.trim();
        applyFilters();
    });
    searchBtn.addEventListener('click', () => {
        searchTerm = searchInput.value.trim();
        applyFilters();
    });

    // Category filters
    document.querySelectorAll('#categoryFilter .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#categoryFilter .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            applyFilters();
        });
    });

    // Difficulty filters
    document.querySelectorAll('#difficultyFilter .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#difficultyFilter .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.dataset.difficulty;
            applyFilters();
        });
    });

    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', () => {
        searchTerm = '';
        document.getElementById('searchInput').value = '';
        currentCategory = 'all';
        currentDifficulty = 'all';
        document.querySelectorAll('#categoryFilter .filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#categoryFilter .filter-btn[data-category="all"]')?.classList.add('active');
        document.querySelectorAll('#difficultyFilter .filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#difficultyFilter .filter-btn[data-difficulty="all"]')?.classList.add('active');
        applyFilters();
    });

    // Carousel navigation
    const track = document.getElementById('carouselTrack');
    document.getElementById('carouselPrev').addEventListener('click', () => {
        track.scrollBy({ left: -220, behavior: 'smooth' });
    });
    document.getElementById('carouselNext').addEventListener('click', () => {
        track.scrollBy({ left: 220, behavior: 'smooth' });
    });

    // Toggle sidebar on mobile
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
    });
}