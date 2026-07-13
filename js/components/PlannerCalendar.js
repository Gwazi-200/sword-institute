export function createPlannerCalendar(container, items = []) {
    if (!container) {
        return null;
    }

    container.innerHTML = `
        <section class="glass-card" aria-label="Academic planner">
            <h2>Academic Planner</h2>
            <ul>
                ${items.length ? items.map((item) => `<li><strong>${item.title}</strong> — ${item.date} ${item.time || ''}</li>`).join('') : '<li>No upcoming items.</li>'}
            </ul>
        </section>
    `;

    return { container };
}

export default createPlannerCalendar;
