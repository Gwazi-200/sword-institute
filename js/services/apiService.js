const PROVIDERS = ['openai', 'gemini', 'claude', 'deepseek', 'groq', 'local'];

function sanitizeInput(input = '') {
    return String(input).replace(/<[^>]*>/g, '').trim();
}

async function request({ endpoint = '/', method = 'GET', body = null, provider = 'local' }) {
    const normalizedProvider = PROVIDERS.includes(provider) ? provider : 'local';
    const payload = body ? JSON.stringify(body) : null;

    const response = await fetch(endpoint, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Provider': normalizedProvider,
        },
        body: payload,
    });

    if (!response.ok) {
        throw new Error('Unable to complete the request right now.');
    }

    return response.json().catch(() => ({}));
}

async function sendToProfessor(message, context = {}) {
    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
        return { reply: 'How can I help you today?' };
    }

    return request({
        endpoint: '/api/professor',
        method: 'POST',
        body: {
            message: sanitizedMessage,
            context,
        },
        provider: 'local',
    });
}

export { request, sendToProfessor, PROVIDERS };
export default { request, sendToProfessor, PROVIDERS };
