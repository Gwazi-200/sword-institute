export function createAnalyticsDashboard(container, data = {}) {
    if (!container) {
        return null;
    }

    const stats = [
        { label: 'Active learners', value: data.activeLearners ?? 0 },
        { label: 'Completion rate', value: `${data.completionRate ?? 0}%` },
        { label: 'Knowledge Hub use', value: data.knowledgeHubUse ?? 0 },
        { label: 'Professor SWORD use', value: data.professorUse ?? 0 },
    ];

    container.innerHTML = `
        <section class="glass-card" aria-label="Instructor analytics">
            <h2>Instructor Analytics</h2>
            <div class="studio-stats">
                ${stats.map((item) => `<article><strong>${item.value}</strong><span>${item.label}</span></article>`).join('')}
            </div>
        </section>
    `;

    return { container };
}

export default createAnalyticsDashboard;
