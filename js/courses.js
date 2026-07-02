const COURSES = [
    {
        id: 1,
        icon: '🌐',
        title: 'Web Alchemy',
        description: 'Modern HTML, CSS, and JavaScript to craft polished responsive experiences.',
        duration: '12 Weeks',
        tags: ['Frontend', 'HTML', 'CSS', 'JS']
    },
    {
        id: 2,
        icon: '🐍',
        title: 'Python Pathways',
        description: 'Build automation, data skills, and scripting confidence with Python.',
        duration: '10 Weeks',
        tags: ['Python', 'Data', 'Automation']
    },
    {
        id: 3,
        icon: '🧠',
        title: 'AI & Consciousness',
        description: 'Explore machine learning principles, ethics, and future-ready AI workflows.',
        duration: '14 Weeks',
        tags: ['AI', 'Machine Learning', 'Ethics']
    },
    {
        id: 4,
        icon: '📊',
        title: 'Data Science for Social Good',
        description: 'Use data to solve community problems and create measurable social impact.',
        duration: '8 Weeks',
        tags: ['Data Science', 'Statistics', 'Impact']
    }
];

const searchInput = document.getElementById('course-search');
const searchButton = document.getElementById('search-button');
const coursesGrid = document.getElementById('courses-grid');
const navLogin = document.getElementById('nav-login');

function renderCourses(list) {
    if (!coursesGrid) return;
    if (!list.length) {
        coursesGrid.innerHTML = '<p class="empty-state">No courses match your search.</p>';
        return;
    }

    coursesGrid.innerHTML = list.map(course => `
        <div class="course-card">
            <div class="icon">${course.icon}</div>
            <h3>${course.title}</h3>
            <p class="course-desc">${course.description}</p>
            <div class="meta">${course.duration}</div>
            <div class="tags">${course.tags.map(tag => `<span>#${tag}</span>`).join('')}</div>
            <button class="btn-sm btn-primary" type="button">View Course</button>
        </div>
    `).join('');
}

function initSearch() {
    const term = searchInput?.value.trim().toLowerCase() || '';
    const filtered = term
        ? COURSES.filter(course =>
            course.title.toLowerCase().includes(term) ||
            course.description.toLowerCase().includes(term) ||
            course.tags.some(tag => tag.toLowerCase().includes(term))
        )
        : COURSES;
    renderCourses(filtered);
}

function init() {
    renderCourses(COURSES);

    if (searchButton) {
        searchButton.addEventListener('click', initSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                initSearch();
            }
        });
    }

    const student = localStorage.getItem('sword_student');
    if (student && navLogin) {
        navLogin.style.display = 'none';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
