function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function createMissionCard(data = {}) {
    const title = data.title || 'Today’s mission';
    const body = data.body || 'Complete one focused study block and keep your momentum moving.';
    const cta = data.cta || 'Open your next lesson';

    return `
        <section class="dashboard-module dashboard-module--mission glass-card">
            <div class="dashboard-module__header">
                <div>
                    <p class="dashboard-module__eyebrow">Daily focus</p>
                    <h3>${escapeHtml(title)}</h3>
                </div>
                <span class="dashboard-module__pill">Live</span>
            </div>
            <p class="dashboard-module__body">${escapeHtml(body)}</p>
            <a href="courses.html" class="dashboard-module__action">${escapeHtml(cta)}</a>
        </section>
    `;
}

function createStatsCard(data = {}) {
    return `
        <section class="dashboard-module dashboard-module--stats glass-card">
            <p class="dashboard-module__eyebrow">Momentum</p>
            <h3>${escapeHtml(data.title || 'Your progress')}</h3>
            <div class="dashboard-module__stat">${escapeHtml(data.value || '0')}</div>
            <p class="dashboard-module__body">${escapeHtml(data.subtitle || 'Keep showing up for your next lesson.')}</p>
        </section>
    `;
}

function createActivityCard(items = []) {
    if (!items.length) {
        return `
            <section class="dashboard-module dashboard-module--activity glass-card">
                <div class="dashboard-module__header">
                    <div>
                        <p class="dashboard-module__eyebrow">Timeline</p>
                        <h3>Recent activity</h3>
                    </div>
                </div>
                <p class="dashboard-module__body">You have no recent activity yet. Start a course to build your momentum.</p>
            </section>
        `;
    }

    const rows = items.slice(0, 4).map((item) => {
        const title = item.title || 'Learning milestone';
        const subtitle = item.subtitle || 'In progress';
        return `
            <li class="dashboard-module__row">
                <div>
                    <strong>${escapeHtml(title)}</strong>
                    <p>${escapeHtml(subtitle)}</p>
                </div>
            </li>
        `;
    }).join('');

    return `
        <section class="dashboard-module dashboard-module--activity glass-card">
            <div class="dashboard-module__header">
                <div>
                    <p class="dashboard-module__eyebrow">Timeline</p>
                    <h3>Recent activity</h3>
                </div>
            </div>
            <ul class="dashboard-module__list">${rows}</ul>
        </section>
    `;
}

function createRecommendationCard(data = {}) {
    return `
        <section class="dashboard-module dashboard-module--recommendation glass-card">
            <div class="dashboard-module__header">
                <div>
                    <p class="dashboard-module__eyebrow">Professor SWORD</p>
                    <h3>${escapeHtml(data.title || 'Next best step')}</h3>
                </div>
            </div>
            <p class="dashboard-module__body">${escapeHtml(data.body || 'Your next best step is to continue with the course that matches your current momentum.')}</p>
            <a href="ai-message.html" class="dashboard-module__action">Ask for guidance</a>
        </section>
    `;
}

export { createMissionCard, createStatsCard, createActivityCard, createRecommendationCard };
export default { createMissionCard, createStatsCard, createActivityCard, createRecommendationCard };