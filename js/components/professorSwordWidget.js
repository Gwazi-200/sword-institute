function createProfessorSwordWidget(container, options = {}) {
    if (!container) return null;

    const heading = options.heading || 'Professor SWORD';
    const subtitle = options.subtitle || 'Your AI Learning Assistant';

    container.innerHTML = `
        <section class="professor-sword-widget glass-card" aria-label="Professor SWORD assistant" role="region">
            <div class="professor-sword-widget__header">
                <div class="professor-sword-widget__icon" aria-hidden="true">👨‍🏫</div>
                <div class="professor-sword-widget__copy">
                    <h3>${heading}</h3>
                    <p>${subtitle}</p>
                </div>
                <span class="professor-sword-widget__status" aria-label="Online status">● Online</span>
            </div>
            <div class="professor-sword-widget__body">
                <p>Ask for explanations, study plans, revision notes, practice questions, and recommendations.</p>
            </div>
        </section>
    `;

    return {
        container,
        refresh: () => container.innerHTML = container.innerHTML
    };
}

export { createProfessorSwordWidget };
export default createProfessorSwordWidget;