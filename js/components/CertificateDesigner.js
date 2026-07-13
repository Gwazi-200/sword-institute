export function createCertificateDesigner(container) {
    if (!container) {
        return null;
    }

    container.innerHTML = `
        <section class="glass-card" aria-label="Certificate designer">
            <h2>Certificate Manager</h2>
            <form data-certificate-form>
                <label>
                    Certificate name
                    <input name="name" placeholder="Completion certificate" />
                </label>
                <button type="submit">Save template</button>
            </form>
        </section>
    `;

    const form = container.querySelector('[data-certificate-form]');
    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const payload = Object.fromEntries(data.entries());
        container.dispatchEvent(new CustomEvent('studio:certificate-created', { detail: payload }));
    });

    return { container };
}

export default createCertificateDesigner;
