export function createAssessmentBuilder(container) {
    if (!container) {
        return null;
    }

    container.innerHTML = `
        <section class="glass-card" aria-label="Assessment builder">
            <h2>Assessment Studio</h2>
            <p>Build quizzes, assignments, rubrics, and feedback loops.</p>
            <form data-assessment-form>
                <label>
                    Assessment title
                    <input name="title" required placeholder="Quiz or assignment" />
                </label>
                <label>
                    Type
                    <select name="type">
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                    </select>
                </label>
                <button type="submit">Create assessment</button>
            </form>
        </section>
    `;

    const form = container.querySelector('[data-assessment-form]');
    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const payload = Object.fromEntries(data.entries());
        container.dispatchEvent(new CustomEvent('studio:assessment-created', { detail: payload }));
    });

    return { container };
}

export default createAssessmentBuilder;
