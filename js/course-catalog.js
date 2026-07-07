// course-catalog.js – Sword Institute Course Catalogue
// Module: uses the project’s canonical firebase exports (js/firebase.js)

import {
    auth,
    db,
    onAuthStateChanged,
    signOut,
    collection,
    getDocs,
    query,
    where
} from './firebase.js';

// ============================================================
// STATE
// ============================================================
let allCourses = [];                 // all published courses from Firestore
let filteredCourses = [];           // after category/difficulty/search
let displayedCourses = [];          // current page slice
let currentCategory = 'all';
let currentDifficulty = 'all';
let searchTerm = '';
let sortBy = 'title';               // default sort
let currentPage = 1;
const pageSize = 6;                 // courses per page
let isLoading = false;
let hasMore = true;

// DOM references
const courseGrid = document.getElementById('courseGrid');
const continueGrid = document.getElementById('continueGrid');
const recommendedGrid = document.getElementById('recommendedGrid');
const carouselTrack = document.getElementById('carouselTrack');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const modalOverlay = document.getElementById('courseModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

// ============================================================
// UTILITY: show/hide loading, error, empty
// ============================================================
function showLoading() {
    if (!courseGrid || !courseGrid.parentNode) return;
    const loader = document.createElement('div');
    loader.id = 'loadingSpinner';
    loader.className = 'loading-spinner';
    loader.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';

    courseGrid.parentNode.insertBefore(loader, courseGrid);
    courseGrid.style.display = 'none';
}

function hideLoading() {
    const loader = document.getElementById('loadingSpinner');
    if (loader) loader.remove();
    if (courseGrid) courseGrid.style.display = 'grid';
}

function showError(message) {
    if (!courseGrid || !courseGrid.parentNode) return;
    const errorDiv = document.createElement('div');
    errorDiv.id = 'errorMessage';
    errorDiv.className = 'error-message glass';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    courseGrid.parentNode.insertBefore(errorDiv, courseGrid);
    courseGrid.style.display = 'none';
}

function clearError() {
    const err = document.getElementById('errorMessage');
    if (err) err.remove();
    if (courseGrid) courseGrid.style.display = 'grid';
}

function showEmptyState() {
    if (!courseGrid) return;
    courseGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <p>No courses match your filters. Try adjusting your search.</p>
        </div>
    `;
}

// ============================================================
// LOAD COURSES FROM FIRESTORE
// ============================================================
async function loadCourses() {
    showLoading();
    clearError();
    try {
        const coursesRef = collection(db, 'courses');
        // Only published courses
        const q = query(coursesRef, where('published', '==', true));
        const snapshot = await getDocs(q);
        allCourses = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            // Ensure defaults
            data.progress = data.progress || 0;
            data.rating = data.rating || 0;
            data.duration = data.duration || 0;
            data.image = data.image || 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Course';
            data.instructor = data.instructor || 'Instructor';
            data.description = data.description || '';
            data.difficulty = data.difficulty || 'beginner';
            data.category = data.category || 'professional';
            allCourses.push(data);
        });
        hideLoading();
        if (allCourses.length === 0) {
            showEmptyState();
            updateStats([]);
            return;
        }
        // Apply filters, sort, and render
        applyFiltersAndRender();
        updateStats(allCourses);
        renderContinueLearning();
        renderRecommended();
        renderPopularCarousel();
    } catch (error) {
        console.error('Error loading courses:', error);
        hideLoading();
        showError('Failed to load courses. Please try again later.');
        // Fallback sample data (for demo if Firestore fails)
        useFallbackData();
    }
}

// ============================================================
// FALLBACK DATA (for development / offline)
// ============================================================
function useFallbackData() {
    allCourses = [
        { id: '1', title: 'Communication Skills', category: 'professional', difficulty: 'beginner', duration: 3, rating: 4.5, progress: 75, instructor: 'Dr. Jane', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Communication', description: 'Master effective communication.', published: true },
        { id: '2', title: 'Administration & Management', category: 'professional', difficulty: 'intermediate', duration: 4, rating: 4.2, progress: 40, instructor: 'Mr. Smith', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Admin', description: 'Learn administration skills.', published: true },
        { id: '3', title: 'AI Basic Education', category: 'ai', difficulty: 'advanced', duration: 5, rating: 4.8, progress: 25, instructor: 'Dr. Khan', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=AI', description: 'Introduction to AI.', published: true },
        { id: '4', title: 'Community Based Organisations', category: 'community', difficulty: 'intermediate', duration: 3, rating: 4.0, progress: 65, instructor: 'Mr. Omar', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=CBO', description: 'Manage CBOs effectively.', published: true },
        { id: '5', title: 'Child Welfare Programmes', category: 'community', difficulty: 'beginner', duration: 4, rating: 4.7, progress: 55, instructor: 'Ms. Aisha', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Child+Welfare', description: 'Child welfare practices.', published: true },
        { id: '6', title: 'Psychosocial Support', category: 'wellbeing', difficulty: 'beginner', duration: 3.5, rating: 4.3, progress: 30, instructor: 'Dr. Patel', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Psychosocial', description: 'Support mental health.', published: true },
        { id: '7', title: 'Home Based Care', category: 'wellbeing', difficulty: 'beginner', duration: 2, rating: 4.1, progress: 80, instructor: 'Nurse Grace', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Home+Care', description: 'Home care basics.', published: true },
        { id: '8', title: 'Entrepreneurship', category: 'professional', difficulty: 'beginner', duration: 2.5, rating: 4.6, progress: 90, instructor: 'Prof. Lee', image: 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Entrepreneurship', description: 'Start your own business.', published: true },
    ];
    hideLoading();
    applyFiltersAndRender();
    updateStats(allCourses);
    renderContinueLearning();
    renderRecommended();
    renderPopularCarousel();
}

// ============================================================
// FILTER, SORT, PAGINATE
// ============================================================
function filterCourses() {
    return allCourses.filter(course => {
        // Category
        if (currentCategory !== 'all' && course.category !== currentCategory) return false;
        // Difficulty
        if (currentDifficulty !== 'all' && course.difficulty !== currentDifficulty) return false;
        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const match = course.title.toLowerCase().includes(term) ||
                          course.description.toLowerCase().includes(term) ||
                          course.instructor.toLowerCase().includes(term);
            if (!match) return false;
        }
        return true;
    });
}

function sortCourses(courses) {
    const sorted = [...courses];
    switch (sortBy) {
        case 'title':
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'rating':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
        case 'duration':
            sorted.sort((a, b) => a.duration - b.duration);
            break;
        case 'progress':
            sorted.sort((a, b) => b.progress - a.progress);
            break;
        default:
            break;
    }
    return sorted;
}

function applyFiltersAndRender() {
    filteredCourses = sortCourses(filterCourses());
    currentPage = 1;
    hasMore = filteredCourses.length > pageSize;
    renderPage();
    updateLoadMoreButton();
}

function renderPage() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    displayedCourses = filteredCourses.slice(start, end);
    if (displayedCourses.length === 0 && currentPage === 1) {
        showEmptyState();
    } else {
        renderCourses(displayedCourses);
    }
    // Check if more
    hasMore = end < filteredCourses.length;
    updateLoadMoreButton();
}

function loadMore() {
    if (!hasMore || isLoading) return;
    currentPage++;
    renderPage();
}

// ============================================================
// RENDER COURSES
// ============================================================
function renderCourses(courses) {
    courseGrid.innerHTML = '';
    if (courses.length === 0) {
        showEmptyState();
        return;
    }
    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card glass';
        card.setAttribute('data-course-id', course.id);
        // Click on card redirects to course player
        card.addEventListener('click', () => {
            window.location.href = `course-player.html?id=${course.id}`;
        });
        // Prevent modal open on card click – we'll keep separate button for modal
        card.style.cursor = 'pointer';

        const progress = course.progress || 0;
        const rating = course.rating || 0;
        const img = course.image || 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Course';

        card.innerHTML = `
            <img src="${img}" alt="${course.title}" loading="lazy" />
            <h3>${course.title}</h3>
            <div class="meta">
                <span><i class="fas fa-user"></i> ${course.instructor}</span>
                <span class="rating"><i class="fas fa-star"></i> ${rating.toFixed(1)}</span>
                <span><i class="fas fa-clock"></i> ${course.duration}h</span>
                <span class="badge">${course.difficulty}</span>
            </div>
            <div class="progress-wrap">
                <progress value="${progress}" max="100"></progress>
                <span>${progress}%</span>
            </div>
            <button class="btn-detail" data-id="${course.id}">View Details</button>
        `;
        courseGrid.appendChild(card);

        // Modal button – stop propagation to avoid redirect
        const detailBtn = card.querySelector('.btn-detail');
        detailBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(course);
        });
    });
}

// ============================================================
// RENDER CONTINUE LEARNING, RECOMMENDED, POPULAR (FEATURED)
// ============================================================
function renderContinueLearning() {
    const inProgress = allCourses.filter(c => c.progress > 0 && c.progress < 100).slice(0, 4);
    continueGrid.innerHTML = '';
    if (inProgress.length === 0) {
        continueGrid.innerHTML = '<p>No courses in progress. Start learning today!</p>';
        return;
    }
    inProgress.forEach(course => {
        const card = createMiniCard(course);
        continueGrid.appendChild(card);
    });
}

function renderRecommended() {
    // Recommend based on high rating or incomplete
    const recommended = allCourses
        .filter(c => c.rating >= 4.0 && c.progress < 100)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
    recommendedGrid.innerHTML = '';
    if (recommended.length === 0) {
        recommendedGrid.innerHTML = '<p>Check back later for recommendations.</p>';
        return;
    }
    recommended.forEach(course => {
        const card = createMiniCard(course);
        recommendedGrid.appendChild(card);
    });
}

function renderPopularCarousel() {
    // Featured courses – treat as "popular"
    const popular = allCourses
        .filter(c => c.rating >= 4.5)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 8);
    carouselTrack.innerHTML = '';
    if (popular.length === 0) {
        carouselTrack.innerHTML = '<p>No popular courses yet.</p>';
        return;
    }
    popular.forEach(course => {
        const card = createMiniCard(course);
        card.style.minWidth = '200px';
        carouselTrack.appendChild(card);
    });
}

function createMiniCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card glass';
    card.setAttribute('data-course-id', course.id);
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
        window.location.href = `course-player.html?id=${course.id}`;
    });
    const img = course.image || 'https://placehold.co/400x200/7C3AED/FFFFFF?text=Course';
    card.innerHTML = `
        <img src="${img}" alt="${course.title}" loading="lazy" />
        <h3>${course.title}</h3>
        <div class="meta">
            <span>${course.instructor}</span>
            <span class="rating"><i class="fas fa-star"></i> ${course.rating.toFixed(1)}</span>
        </div>
        <button class="btn-detail" data-id="${course.id}">View</button>
    `;
    // Stop propagation on button to avoid double navigation
    const btn = card.querySelector('.btn-detail');
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(course);
    });
    return card;
}

// ============================================================
// STATISTICS
// ============================================================
function updateStats(courses) {
    const total = courses.length;
    const completed = courses.filter(c => c.progress >= 100).length;
    const totalHours = courses.reduce((sum, c) => sum + (c.duration || 0), 0);
    const certCount = courses.filter(c => c.certificateAvailable).length || 3;

    document.getElementById('statEnrolled').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statHours').textContent = totalHours;
    document.getElementById('statCertificates').textContent = certCount;
    document.getElementById('totalCourses').textContent = total;
    const avg = total ? (courses.reduce((s, c) => s + c.rating, 0) / total).toFixed(1) : 0;
    document.getElementById('avgRating').textContent = avg;
}

// ============================================================
// MODAL
// ============================================================
function openModal(course) {
    const img = course.image || 'https://placehold.co/600x300/7C3AED/FFFFFF?text=Course';
    modalBody.innerHTML = `
        <img src="${img}" alt="${course.title}" class="course-detail-img" />
        <h2>${course.title}</h2>
        <p>${course.description || 'No description available.'}</p>
        <div class="detail-meta">
            <span><i class="fas fa-user"></i> ${course.instructor}</span>
            <span><i class="fas fa-clock"></i> ${course.duration}h</span>
            <span><i class="fas fa-star"></i> ${course.rating.toFixed(1)}</span>
            <span><i class="fas fa-tag"></i> ${course.difficulty}</span>
            <span><i class="fas fa-chart-line"></i> Progress: ${course.progress}%</span>
        </div>
        <button class="btn-detail" style="background: var(--primary); color: #fff; border: none; padding: 10px 24px; border-radius: 40px; cursor: pointer;" data-id="${course.id}">Go to Course</button>
    `;
    const goBtn = modalBody.querySelector('.btn-detail');
    goBtn.addEventListener('click', () => {
        window.location.href = `course-player.html?id=${course.id}`;
    });
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

// ============================================================
// PAGINATION – LOAD MORE BUTTON
// ============================================================
function updateLoadMoreButton() {
    let loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!hasMore) {
        if (loadMoreBtn) loadMoreBtn.remove();
        return;
    }
    if (!loadMoreBtn) {
        loadMoreBtn = document.createElement('button');
        loadMoreBtn.id = 'loadMoreBtn';
        loadMoreBtn.className = 'load-more-btn glass';
        loadMoreBtn.textContent = 'Load More Courses';
        courseGrid.parentNode.insertBefore(loadMoreBtn, courseGrid.nextSibling);
        loadMoreBtn.addEventListener('click', loadMore);
    }
    loadMoreBtn.style.display = 'block';
}

// ============================================================
// SORT DROPDOWN (dynamic injection)
// ============================================================
function injectSortDropdown() {
    const filterPanel = document.querySelector('.filter-panel');
    if (!filterPanel) return;
    // Check if already exists
    if (document.getElementById('sortDropdown')) return;
    const sortGroup = document.createElement('div');
    sortGroup.className = 'filter-group';
    sortGroup.innerHTML = `
        <label for="sortSelect">Sort by</label>
        <select id="sortSelect" class="sort-select">
            <option value="title">Title (A-Z)</option>
            <option value="rating">Rating (High to Low)</option>
            <option value="duration">Duration (Shortest)</option>
            <option value="progress">Progress (Most)</option>
        </select>
    `;
    filterPanel.appendChild(sortGroup);
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        sortBy = e.target.value;
        applyFiltersAndRender();
    });
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setupEventListeners() {
    if (!searchInput || !searchBtn) return;

    // Search
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.trim();
        applyFiltersAndRender();
    });
    searchBtn.addEventListener('click', () => {
        searchTerm = searchInput.value.trim();
        applyFiltersAndRender();
    });

    // Category filters
    document.querySelectorAll('#categoryFilter .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#categoryFilter .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            applyFiltersAndRender();
        });
    });

    // Difficulty filters
    document.querySelectorAll('#difficultyFilter .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#difficultyFilter .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.dataset.difficulty;
            applyFiltersAndRender();
        });
    });

    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', () => {
        searchTerm = '';
        searchInput.value = '';
        currentCategory = 'all';
        currentDifficulty = 'all';
        document.querySelectorAll('#categoryFilter .filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#categoryFilter .filter-btn[data-category="all"]')?.classList.add('active');
        document.querySelectorAll('#difficultyFilter .filter-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('#difficultyFilter .filter-btn[data-difficulty="all"]')?.classList.add('active');
        applyFiltersAndRender();
    });

    // Modal close
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
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

    // Inject sort dropdown
    injectSortDropdown();
}

// ============================================================
// AUTH & INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        // Populate avatar
        const name = user.displayName || 'Student';
        const photo = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7C3AED&color=fff&size=80`;
        document.getElementById('studentAvatar').src = photo;
        // Set date
        const now = new Date();
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

        // Load courses
        loadCourses();
        setupEventListeners();
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        }).catch(console.error);
    });
});