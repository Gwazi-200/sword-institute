export function createCourseBuilder(container) {
    if (!container) {
        return null;
    }

    container.innerHTML = `
        <section class="glass-card" aria-label="Course builder">
            <h2>Course Builder</h2>
            <p>Create course outlines, modules, lessons, and publish workflows.</p>
            <form data-course-form>
                <label>
                    Course title
                    <input name="title" required placeholder="Course title" />
                </label>
                <label>
                    Description
                    <textarea name="description" placeholder="Describe the course"></textarea>
                </label>
                <label>
                    Estimated duration
                    <input name="estimatedDuration" placeholder="4 weeks" />
                </label>
                <button type="submit">Save draft</button>
            </form>
        </section>
    `;

    const form = container.querySelector('[data-course-form]');
    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const payload = Object.fromEntries(data.entries());
        container.dispatchEvent(new CustomEvent('studio:course-created', { detail: payload }));
    });

    return { container };
}

export default createCourseBuilder;
