function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
}

function createDashboardHero(container, data = {}) {
    if (!container) return null;

    const greeting = getGreeting();
    const name = data.name || 'Learner';
    const quote = data.quote || 'Small progress every day creates extraordinary leaders.';
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    container.innerHTML = `
        <section class="sword-dashboard-hero glass-card" aria-label="Dashboard overview">
            <div class="sword-dashboard-hero__content">
                <p class="sword-dashboard-hero__eyebrow">${greeting} ${name} 👋</p>
                <h2>Welcome back to your Learning Command Center.</h2>
                <p class="sword-dashboard-hero__meta">${today}</p>
                <blockquote>“${quote}”</blockquote>
            </div>
            <div class="sword-dashboard-hero__actions">
                <a href="courses.html" class="sword-dashboard-hero__button">Continue Learning</a>
                <a href="knowledge-hub.html" class="sword-dashboard-hero__button sword-dashboard-hero__button--ghost">Explore Knowledge Hub</a>
            </div>
        </section>
    `;

    return container;
}

export { createDashboardHero, getGreeting };
export default createDashboardHero;