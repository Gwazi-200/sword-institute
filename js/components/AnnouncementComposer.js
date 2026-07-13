export function createAnnouncementComposer(container) {
    if (!container) {
        return null;
    }

    container.innerHTML = `
        <section class="glass-card" aria-label="Communication centre">
            <h2>Communication Centre</h2>
            <form data-announcement-form>
                <label>
                    Title
                    <input name="title" placeholder="New announcement" />
                </label>
                <label>
                    Message
                    <textarea name="body" placeholder="Write your message"></textarea>
                </label>
                <button type="submit">Publish</button>
            </form>
        </section>
    `;

    const form = container.querySelector('[data-announcement-form]');
    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const payload = Object.fromEntries(data.entries());
        container.dispatchEvent(new CustomEvent('studio:announcement-created', { detail: payload }));
    });

    return { container };
}

export default createAnnouncementComposer;
