function sanitizeMessage(message) {
    if (!message) {
        return 'Something went wrong. Please try again.';
    }

    const text = String(message).replace(/\s+/g, ' ').trim();
    if (text.length > 180) {
        return `${text.slice(0, 177)}...`;
    }

    return text;
}

function handleError(error, context = 'application') {
    const friendlyMessage = sanitizeMessage(error?.message || 'Something went wrong. Please try again.');
    if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('sword:error', { detail: { context, message: friendlyMessage } }));
    }

    console.error(`[${context}]`, friendlyMessage);
    return friendlyMessage;
}

export { handleError, sanitizeMessage };
export default { handleError, sanitizeMessage };
