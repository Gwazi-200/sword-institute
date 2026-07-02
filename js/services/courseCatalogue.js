// js/courseCatalogue.js – Main controller
import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { courseService } from './services/courseService.js';
import { courseCard } from './components/courseCard.js';

// State
let currentUser = null;
let allCourses = [];
let filteredCourses = [];
let currentPage = 1;
const pageSize = 9;
let isLoading = false;
let hasMore = true;
let currentView = 'grid';
let filters = {
    category: 'all',
    level: 'all',
    features: [],
    search: '',
    sort: 'newest',
};

// DOM refs
const courseGrid = document.getElementById('courseGrid');
const featuredGrid = document.getElementById('featuredGrid');
const recommendedGrid = document.getElementById('recommendedGrid');
const categoryCarousel = document.getElementById('categoryCarousel');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const filterToggle = document.getElementById('filterToggle');
const filterPanel = document.getElementById('filterPanel');
const categoryFiltersContainer = document.getElementById('categoryFilters');
const levelFilters = document.querySelectorAll('#levelFilters .filter-chip');
const featureFilters = document.querySelectorAll('#featureFilters .filter-chip');
const sortSelect = document.getElementById('sortSelect');
const viewBtns = document.querySelectorAll('.view-btn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const retryBtn = document.getElementById('retryBtn');
const filterCount = document.getElementById('filterCount');
const clearFiltersBtn = document.getElementById('clearFilters');
const mentorMessage = document.getElementById('mentorMessage');
const mentorTip = document.getElementById('mentorTip');
const mentorRefreshBtn = document.getElementById('mentorRefreshBtn');

// ============================================================
// AUTH
// ============================================================
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
    populateUserInfo(user);
    initApp();
});

document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => window.location.href = 'login.html');
});

function populateUserInfo(user) {
    const name = user.displayName || 'Student';
    const photo = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7C3AED&color=fff&size=80`;
    document.getElementById('studentAvatar').src = photo;
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}

// ============================================================
// INIT
// ============================================================
async function initApp() {
    setupEventListeners();
    await loadCategories();
    await loadCourses();
    setupMentorMessages();
}

// ============================================================
// CATEGORIES
// ============================================================
async function loadCategories() {
    try {
        const categories = await courseService.getCategories();
        renderCategoryCarousel(categories);
        renderCategoryFilters(categories);
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

function renderCategoryCarousel(categories) {
    categoryCarousel.innerHTML = '';
    const allBtn = document.createElement('div');
    allBtn.className = 'category-card active';
    allBtn.dataset.category = 'all';
    allBtn.innerHTML = `<i class="fas fa-th"></i> All`;
    allBtn.addEventListener('click', () => setCategory('all'));
    categoryCarousel.appendChild(allBtn);

    categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.dataset.category = cat.id;
        card.innerHTML = `<i class="fas fa-${cat.icon || 'folder'}"></i> ${cat.name}`;
        card.addEventListener('click', () => setCategory(cat.id));
        categoryCarousel.appendChild(card);
    });
}

function renderCategoryFilters(categories) {
    categoryFiltersContainer.innerHTML = '';
    const allChip = document.createElement('button');
    allChip.className = 'filter-chip active';
    allChip.dataset.category = 'all';
    allChip.textContent = 'All';
    allChip.addEventListener('click', () => setCategory('all'));
    categoryFiltersContainer.appendChild(allChip);

    categories.forEach(cat => {
        const chip = document.createElement('button');
        chip.className = 'filter-chip';
        chip.dataset.category = cat.id;
        chip.textContent = cat.name;
        chip.addEventListener('click', () => setCategory(cat.id));
        categoryFiltersContainer.appendChild(chip);
    });
}

// ============================================================
// COURSES
// ============================================================
async function loadCourses() {
    showLoading();
    try {
        const result = await courseService.getCourses({
            page: currentPage,
            pageSize,
            filters,
        });
        allCourses = result.courses;
        filteredCourses = allCourses;
        hasMore = result.hasMore;
        renderAll();
        hideLoading();
    } catch (error) {
        console.error('Failed to load courses:', error);
        showError();
    }
}

function renderAll() {
    renderFeaturedCourses();
    renderRecommendedCourses();
    renderCourseGrid();
    updateLoadMoreButton();
    updateFilterCount();
}

function renderFeaturedCourses() {
    const featured = allCourses.filter(c => c.featured).slice(0, 4);
    featuredGrid.innerHTML = '';
    if (featured.length === 0) {
        featuredGrid.innerHTML = '<p class="text-muted">No featured courses available.</p>';
        return;
    }
    featured.forEach(course => {
        const card = courseCard.create(course, currentUser);
        featuredGrid.appendChild(card);
    });
}

function renderRecommendedCourses() {
    // Recommend: highest rated, not featured (or mix)
    const recommended = [...allCourses]
        .filter(c => c.rating >= 4.0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
    recommendedGrid.innerHTML = '';
    if (recommended.length === 0) {
        recommendedGrid.innerHTML = '<p class="text-muted">No recommendations available.</p>';
        return;
    }
    recommended.forEach(course => {
        const card = courseCard.create(course, currentUser);
        recommendedGrid.appendChild(card);
    });
}

function renderCourseGrid() {
    const courses = filteredCourses;
    courseGrid.innerHTML = '';
    if (courses.length === 0) {
        emptyState.hidden = false;
        courseGrid.style.display = 'none';
        return;
    }
    emptyState.hidden = true;
    courseGrid.style.display = 'grid';
    courses.forEach(course => {
        const card = courseCard.create(course, currentUser);
        courseGrid.appendChild(card);
    });
}

// ============================================================
// FILTERING & SORTING
// ============================================================
function applyFilters() {
    const search = filters.search.trim().toLowerCase();
    let result = allCourses;

    // Search
    if (search) {
        result = result.filter(c =>
            c.title.toLowerCase().includes(search) ||
            c.shortDescription.toLowerCase().includes(search) ||
            c.tags.some(t => t.toLowerCase().includes(search))
        );
    }

    // Category
    if (filters.category !== 'all') {
        result = result.filter(c => c.category === filters.category);
    }

    // Level
    if (filters.level !== 'all') {
        result = result.filter(c => c.level === filters.level);
    }

    // Features
    if (filters.features.includes('featured')) {
        result = result.filter(c => c.featured);
    }
    if (filters.features.includes('popular')) {
        result = result.filter(c => c.popular);
    }
    if (filters.features.includes('certificate')) {
        result = result.filter(c => c.certificate);
    }
    if (filters.features.includes('free')) {
        result = result.filter(c => c.price === 0);
    }

    // Sort
    switch (filters.sort) {
        case 'newest':
            result.sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.() || 0);
            break;
        case 'popular':
            result.sort((a, b) => (b.students || 0) - (a.students || 0));
            break;
        case 'rating':
            result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'title':
            result.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'duration':
            result.sort((a, b) => (a.estimatedHours || 0) - (b.estimatedHours || 0));
            break;
        default:
            break;
    }

    filteredCourses = result;
    currentPage = 1;
    hasMore = filteredCourses.length > pageSize;
    renderCourseGrid();
    updateLoadMoreButton();
    updateFilterCount();
}

function setCategory(categoryId) {
    // Update UI
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
    document.querySelector(`.category-card[data-category="${categoryId}"]`)?.classList.add('active');
    document.querySelectorAll('#categoryFilters .filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector(`#categoryFilters .filter-chip[data-category="${categoryId}"]`)?.classList.add('active');

    filters.category = categoryId;
    applyFilters();
}

function updateFilterCount() {
    const count = filteredCourses.length;
    filterCount.textContent = `${count} course${count !== 1 ? 's' : ''}`;
}

function updateLoadMoreButton() {
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
}

// ============================================================
// LOAD MORE
// ============================================================
async function loadMore() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading...';

    try {
        currentPage++;
        const result = await courseService.getCourses({
            page: currentPage,
            pageSize,
            filters,
        });
        // Append new courses to allCourses? Actually we need to combine.
        // Since we already have allCourses filtered, we can just add the new ones.
        // But to keep consistency, we should fetch from Firestore with pagination.
        // For simplicity, we'll store all from API and use pagination client-side.
        // We'll implement a simpler approach: load all courses at once and paginate client-side.
        // But we already have allCourses loaded. So we'll slice based on currentPage.
        // So we need to re-render with new slice.
        // However, we already have allCourses loaded. We'll just slice again.
        // We'll implement a simple client-side pagination.
        const start = 0;
        const end = currentPage * pageSize;
        const slice = filteredCourses.slice(start, end);
        if (slice.length >= filteredCourses.length) {
            hasMore = false;
        }
        renderCourseGrid(); // will show all currently filtered
        updateLoadMoreButton();
    } catch (error) {
        console.error('Load more error:', error);
    } finally {
        isLoading = false;
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Load More';
    }
}

// ============================================================
// UI HELPERS
// ============================================================
function showLoading() {
    // We'll show skeleton cards in the grid
    courseGrid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'course-card skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton-img"></div>
            <div class="card-body">
                <div class="skeleton-line" style="width:70%"></div>
                <div class="skeleton-line" style="width:40%"></div>
                <div class="skeleton-line" style="width:60%"></div>
            </div>
        `;
        courseGrid.appendChild(skeleton);
    }
}

function hideLoading() {
    // skeleton removed when rendering
}

function showError() {
    errorState.hidden = false;
    courseGrid.style.display = 'none';
}

function hideError() {
    errorState.hidden = true;
    courseGrid.style.display = 'grid';
}

// ============================================================
// AI MENTOR MESSAGES
// ============================================================
const mentorMessages = [
    "Small progress every day creates remarkable results.",
    "You are becoming a Digital Warrior. Keep going!",
    "Today's goal: Complete one lesson.",
    "Learning is the only thing the mind never exhausts.",
    "Your future is built by what you do today, not tomorrow.",
    "Embrace the challenge; it's part of your growth.",
    "Every expert was once a beginner. Persist!",
    "AI is transforming the world; you're at the forefront.",
];

let mentorInterval;

function setupMentorMessages() {
    const randomMsg = mentorMessages[Math.floor(Math.random() * mentorMessages.length)];
    mentorMessage.textContent = randomMsg;
    mentorTip.textContent = "💡 " + (mentorMessages[Math.floor(Math.random() * mentorMessages.length)]);

    mentorRefreshBtn.addEventListener('click', refreshMentorMessage);
    // Auto rotate every 30 seconds
    mentorInterval = setInterval(refreshMentorMessage, 30000);
}

function refreshMentorMessage() {
    const msg = mentorMessages[Math.floor(Math.random() * mentorMessages.length)];
    mentorMessage.textContent = msg;
    const tip = mentorMessages[Math.floor(Math.random() * mentorMessages.length)];
    mentorTip.textContent = "💡 " + tip;
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setupEventListeners() {
    // Mobile menu toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        filters.search = e.target.value;
        applyFilters();
    });
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filters.search = '';
        applyFilters();
    });

    // Filter panel toggle
    filterToggle.addEventListener('click', () => {
        const expanded = filterToggle.getAttribute('aria-expanded') === 'true';
        filterToggle.setAttribute('aria-expanded', !expanded);
        filterPanel.hidden = expanded;
    });

    // Level filters
    levelFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            levelFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filters.level = btn.dataset.level;
            applyFilters();
        });
    });

    // Feature filters (toggle)
    featureFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            const feature = btn.dataset.feature;
            const idx = filters.features.indexOf(feature);
            if (idx > -1) {
                filters.features.splice(idx, 1);
                btn.classList.remove('active');
            } else {
                filters.features.push(feature);
                btn.classList.add('active');
            }
            applyFilters();
        });
    });

    // Sort
    sortSelect.addEventListener('change', (e) => {
        filters.sort = e.target.value;
        applyFilters();
    });

    // View toggle
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            courseGrid.className = `course-grid view-${currentView}`;
        });
    });

    // Load more
    loadMoreBtn.addEventListener('click', loadMore);

    // Clear filters
    clearFiltersBtn.addEventListener('click', () => {
        filters.category = 'all';
        filters.level = 'all';
        filters.features = [];
        filters.search = '';
        searchInput.value = '';
        sortSelect.value = 'newest';
        // Reset UI chips
        document.querySelectorAll('#categoryFilters .filter-chip').forEach(c => c.classList.remove('active'));
        document.querySelector('#categoryFilters .filter-chip[data-category="all"]')?.classList.add('active');
        document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
        document.querySelector('.category-card[data-category="all"]')?.classList.add('active');
        levelFilters.forEach(b => b.classList.remove('active'));
        document.querySelector('#levelFilters .filter-chip[data-level="all"]')?.classList.add('active');
        featureFilters.forEach(b => b.classList.remove('active'));
        applyFilters();
    });

    // Retry
    retryBtn.addEventListener('click', () => {
        hideError();
        loadCourses();
    });
}

// ============================================================
// INITIAL LOAD
// ============================================================
// auth already triggers initApp