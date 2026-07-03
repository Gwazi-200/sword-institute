export function getInputElement(selector = '#aiInput') {
    return document.querySelector(selector);
}

export function insertPromptIntoInput(promptText, selector = '#aiInput') {
    const inputEl = getInputElement(selector);
    if (!inputEl) return false;

    inputEl.value = String(promptText || '');
    inputEl.focus();

    if (typeof inputEl.setSelectionRange === 'function') {
        const end = inputEl.value.length;
        inputEl.setSelectionRange(end, end);
    }

    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
}

export function ensureConversationHasStarter(selector = '#aiMessages') {
    const messagesEl = document.querySelector(selector);
    if (!messagesEl) return;

    if (messagesEl.children.length > 0) return;

    const bubble = document.createElement('div');
    bubble.className = 'ai-message-bubble ai';
    bubble.textContent = 'Select a Teaching Mode or Quick Action to begin your guided learning session.';
    messagesEl.appendChild(bubble);
}
