function handleError(error, context = 'application') {
    const friendlyMessage = error?.message || 'Something went wrong. Please try again.';
    if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('sword:error', { detail: { context, message: friendlyMessage } }));
    }

    console.error(`[${context}]`, friendlyMessage);
    return friendlyMessage;
}

export { handleError };
export default { handleError };
