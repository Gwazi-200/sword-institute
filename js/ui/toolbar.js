function createButton(item, sectionLabel) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `ps-toolbar-btn ${item.color === 'secondary' ? 'secondary' : 'primary'}`;
    button.dataset.actionId = item.id;
    button.dataset.promptId = item.prompt;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `${sectionLabel}: ${item.title}`);
    button.innerHTML = `<span class="icon" aria-hidden="true">${item.icon}</span><span class="label">${item.title}</span>`;
    return button;
}

export function renderToolbar(container, items, sectionLabel) {
    if (!container) return;

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
        fragment.appendChild(createButton(item, sectionLabel));
    });

    container.innerHTML = '';
    container.appendChild(fragment);
}

function setActiveInContainer(button, container) {
    if (!button || !container) return;

    container.querySelectorAll('.ps-toolbar-btn').forEach((btn) => {
        btn.classList.remove('is-active');
        btn.setAttribute('aria-pressed', 'false');
    });

    button.classList.add('is-active');
    button.setAttribute('aria-pressed', 'true');
}

export function setupToolbarDelegation(root, handlers) {
    if (!root || root.dataset.toolbarBound === 'true') return;

    root.addEventListener('click', (event) => {
        const button = event.target.closest('.ps-toolbar-btn');
        if (!button || !root.contains(button)) return;

        const promptId = button.dataset.promptId || '';
        const container = button.closest('[data-toolbar-container]');
        if (!promptId || !container) return;

        setActiveInContainer(button, container);

        if (handlers && typeof handlers.onPromptSelected === 'function') {
            handlers.onPromptSelected(promptId, button, container);
        }
    });

    root.addEventListener('keydown', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || !target.classList.contains('ps-toolbar-btn')) return;

        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        target.click();
    });

    root.dataset.toolbarBound = 'true';
}
