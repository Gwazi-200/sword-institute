/**
 * ai-service.js
 * Sword Institute - AI Mentor Service
 * Powered by OpenFrontier AI
 *
 * This service handles all AI interactions across the LMS
 */

// =============================================================
// CONFIGURATION
// =============================================================

// IMPORTANT: In production, store your API key in Firebase Functions or environment variables
// DO NOT hardcode API keys in client-side code.

const AI_CONFIG = {
    // OpenFrontier AI API Endpoint
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',

    // Models to use
    model: 'openai/gpt-3.5-turbo',

    // Fallback model if primary fails
    fallbackModel: 'mistralai/mistral-7b-instruct',

    // Max tokens for responses
    maxTokens: 500,

    // Temperature (creativity level)
    temperature: 0.7,

    // Optional secure proxy URL (recommended production path)
    proxyUrl: ''
};

// =============================================================
// STATE
// =============================================================

let isInitialized = false;
let currentUser = null;
let studentContext = {};
let authListenerAttached = false;

// =============================================================
// INITIALIZATION
// =============================================================

/**
 * Initialize the AI Service
 * Call this once when your app loads
 */
function initAIService(config = {}) {
    AI_CONFIG.model = config.model || AI_CONFIG.model;
    AI_CONFIG.fallbackModel = config.fallbackModel || AI_CONFIG.fallbackModel;
    AI_CONFIG.maxTokens = config.maxTokens || AI_CONFIG.maxTokens;
    AI_CONFIG.temperature = typeof config.temperature === 'number' ? config.temperature : AI_CONFIG.temperature;
    AI_CONFIG.proxyUrl = config.proxyUrl || AI_CONFIG.proxyUrl || (window.SWORD_AI_CONFIG && window.SWORD_AI_CONFIG.proxyUrl) || '';

    if (isInitialized) return true;

    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.warn('Firebase not loaded. AI service will use fallback responses.');
        isInitialized = true;
        return true;
    }

    // Get current user
    const auth = firebase.auth();
    if (auth.currentUser) {
        currentUser = auth.currentUser;
        loadStudentContext();
    }

    // Listen for auth changes once
    if (!authListenerAttached) {
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            if (user) {
                loadStudentContext();
            } else {
                studentContext = {};
            }
        });
        authListenerAttached = true;
    }

    isInitialized = true;
    console.log('AI Service initialized with OpenFrontier AI');
    return true;
}

// =============================================================
// LOAD STUDENT CONTEXT
// =============================================================

async function loadStudentContext() {
    if (!currentUser || typeof firebase === 'undefined') return;

    try {
        const db = firebase.firestore();

        // Get enrollments
        const enrollmentsSnapshot = await db.collection('enrollments')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'active')
            .get();

        const enrollments = [];
        let totalXp = 0;
        let completedCount = 0;

        enrollmentsSnapshot.forEach((doc) => {
            const data = doc.data();
            enrollments.push(data);
            if (data.completed) completedCount++;
            if (data.xpEarned) totalXp += data.xpEarned;
        });

        // Get enrolled course details
        const courseIds = enrollments.map((e) => e.courseId).filter(Boolean);
        const courses = [];
        for (const id of courseIds) {
            const doc = await db.collection('courses').doc(id).get();
            if (doc.exists) {
                courses.push({ id: doc.id, ...doc.data() });
            }
        }

        studentContext = {
            userName: currentUser.displayName || currentUser.email || 'Warrior',
            enrolledCount: enrollments.length,
            completedCount,
            totalXp,
            courses,
            courseTitles: courses.map((c) => c.title).join(', ')
        };

        console.log('Student context loaded:', studentContext);
    } catch (error) {
        console.error('Error loading student context:', error);
        studentContext = {
            userName: (currentUser && (currentUser.displayName || currentUser.email)) || 'Warrior',
            enrolledCount: 0,
            completedCount: 0,
            totalXp: 0,
            courses: [],
            courseTitles: 'None'
        };
    }
}

// =============================================================
// GET STUDENT DATA
// =============================================================

function getStudentData() {
    return studentContext;
}

// =============================================================
// SEND AI MESSAGE (Core Function)
// =============================================================

/**
 * Send a message to the AI and get a response
 * @param {string} message - The user's message
 * @param {string} context - Additional context (e.g., Dashboard, Lesson, Homepage)
 * @param {string|object} lessonContentOrContext - Optional lesson content or context object
 * @returns {Promise<string>} - The AI response
 */
async function sendAIMessage(message, context = 'General', lessonContentOrContext = '') {
    if (!message) return 'Please ask a question.';

    if (!isInitialized) {
        initAIService(window.SWORD_AI_CONFIG || {});
    }

    let lessonContent = '';
    if (typeof lessonContentOrContext === 'string') {
        lessonContent = lessonContentOrContext;
    } else if (lessonContentOrContext && typeof lessonContentOrContext === 'object') {
        const lessonCtx = lessonContentOrContext.lessonContext || {};
        lessonContent = lessonCtx.lessonSummary || '';
    }

    // If no user, still allow API calls if key/proxy is available; otherwise fallback.
    if (!currentUser && !AI_CONFIG.proxyUrl && !(window.SWORD_AI_CONFIG && window.SWORD_AI_CONFIG.apiKey) && !localStorage.getItem('openfrontier_api_key')) {
        return getFallbackResponse(message);
    }

    const systemPrompt = buildSystemPrompt(context, lessonContent);

    try {
        return await callOpenFrontierAI(systemPrompt, message);
    } catch (error) {
        console.error('AI API Error:', error);
        return getFallbackResponse(message);
    }
}

// =============================================================
// BUILD SYSTEM PROMPT
// =============================================================

function buildSystemPrompt(context, lessonContent) {
    const name = studentContext.userName || 'Warrior';
    const enrolled = studentContext.enrolledCount || 0;
    const completed = studentContext.completedCount || 0;
    const xp = studentContext.totalXp || 0;
    const courses = studentContext.courseTitles || 'None';

    let prompt = `You are an AI Mentor for Sword Institute, a community development and social work learning platform.

STUDENT INFORMATION:
- Name: ${name}
- Enrolled Courses: ${enrolled}
- Completed Courses: ${completed}
- Total XP: ${xp}
- Course Titles: ${courses}

Your role is to:
1. Be warm, encouraging, and supportive
2. Provide personalized learning advice
3. Help students understand course content
4. Motivate and inspire continued learning
5. Keep responses concise (2-3 sentences for quick answers)

Tone: Wise, compassionate, and empowering. Use emojis occasionally.

Current Context: ${context}`;

    if (lessonContent) {
        prompt += `\n\nLESSON CONTENT: ${lessonContent.substring(0, 1000)}...`;
        prompt += '\n\nSTUDENT QUESTION: Help the student understand this lesson content and answer their question.';
    }

    prompt += '\n\nRespond to the student question with personalized, actionable advice.';
    return prompt;
}

// =============================================================
// CALL OPENFRONTIER AI API
// =============================================================

async function callOpenFrontierAI(systemPrompt, userMessage) {
    const apiKey = await getAPIKey();
    const endpoint = AI_CONFIG.proxyUrl || AI_CONFIG.apiUrl;

    const headers = {
        'Content-Type': 'application/json'
    };

    if (!AI_CONFIG.proxyUrl) {
        if (!apiKey) {
            throw new Error('API key not available');
        }
        headers.Authorization = `Bearer ${apiKey}`;
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'Sword Institute LMS';
    }

    const payload = {
        model: AI_CONFIG.model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature
    };

    let response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    // Retry with fallback model once
    if (!response.ok && AI_CONFIG.fallbackModel) {
        payload.model = AI_CONFIG.fallbackModel;
        response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
    }

    if (!response.ok) {
        let errorMessage = response.statusText;
        try {
            const errorData = await response.json();
            errorMessage = (errorData && errorData.error && errorData.error.message) || errorMessage;
        } catch (jsonError) {
            // keep statusText
        }
        throw new Error(`API Error: ${errorMessage}`);
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
    }

    throw new Error('No response from AI');
}

// =============================================================
// GET API KEY (Secure Method)
// =============================================================

async function getAPIKey() {
    // Proxy mode does not need frontend key
    if (AI_CONFIG.proxyUrl) return 'PROXY_MODE';

    // Optional key from global config
    if (window.SWORD_AI_CONFIG && window.SWORD_AI_CONFIG.apiKey) {
        return window.SWORD_AI_CONFIG.apiKey;
    }

    // Option 1: Use Firebase Cloud Function (recommended)
    try {
        if (typeof firebase !== 'undefined' && firebase.functions) {
            const functions = firebase.functions();
            const getAIKey = functions.httpsCallable('getAIKey');
            const result = await getAIKey();
            return result.data.apiKey;
        }
    } catch (error) {
        console.error('Failed to get API key from Cloud Function:', error);
    }

    // Option 2: Local storage (development only)
    const localKey = localStorage.getItem('openfrontier_api_key');
    if (localKey) {
        console.warn('Using local API key (development only)');
        return localKey;
    }

    throw new Error('API key not available');
}

// =============================================================
// GET AI RECOMMENDATION
// =============================================================

async function getRecommendation() {
    try {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase not available');
        }

        const db = firebase.firestore();
        const coursesSnapshot = await db.collection('courses').orderBy('order', 'asc').get();

        const allCourses = [];
        coursesSnapshot.forEach((doc) => {
            allCourses.push({ id: doc.id, ...doc.data() });
        });

        const enrolledIds = (studentContext.courses || []).map((c) => c.id);
        const available = allCourses.filter((c) => !enrolledIds.includes(c.id));

        let recommendation = '';
        let reasoning = '';

        if (available.length === 0) {
            recommendation = "You've completed all available courses. Check back soon for new content.";
            reasoning = 'All courses completed.';
        } else if ((studentContext.enrolledCount || 0) === 0) {
            const firstAvailable = available[0];
            recommendation = `I recommend starting with "${firstAvailable.title}". It is a great foundation for your learning journey.`;
            reasoning = 'No enrollments found.';
        } else if ((studentContext.completedCount || 0) === 0 && (studentContext.enrolledCount || 0) > 0) {
            recommendation = 'Focus on completing your current courses before starting new ones. You are doing great.';
            reasoning = 'Enrolled but not completed.';
        } else {
            const priorityCategories = ['Community Development', 'Communication', 'Social Work'];
            let recommended = null;

            for (const cat of priorityCategories) {
                const found = available.find((c) => c.category === cat);
                if (found) {
                    recommended = found;
                    break;
                }
            }

            if (!recommended && available.length > 0) {
                recommended = available[0];
            }

            if (recommended) {
                recommendation = `Based on your progress, I recommend "${recommended.title}". It is a strong next step.`;
                reasoning = 'Recommended based on category priority.';
            } else {
                recommendation = 'Explore our course catalogue to find your next learning path.';
                reasoning = 'No suitable course found.';
            }
        }

        return {
            success: true,
            recommendation,
            reasoning,
            availableCourses: available.length,
            completedCourses: studentContext.completedCount || 0,
            enrolledCourses: studentContext.enrolledCount || 0
        };
    } catch (error) {
        console.error('Recommendation Error:', error);
        return {
            success: false,
            recommendation: 'Check out our course catalogue for great options.',
            error: error.message
        };
    }
}

// Backward-compatible API used by existing dashboard integration.
async function getLearningRecommendations(studentData = {}) {
    if (studentData && typeof studentData === 'object') {
        studentContext = {
            ...studentContext,
            userName: studentData.userName || studentContext.userName || 'Warrior',
            enrolledCount: Array.isArray(studentData.enrolledCourses) ? studentData.enrolledCourses.length : (studentContext.enrolledCount || 0),
            completedCount: Array.isArray(studentData.completedCourses) ? studentData.completedCourses.length : (studentContext.completedCount || 0),
            totalXp: typeof studentData.totalXp === 'number' ? studentData.totalXp : (studentContext.totalXp || 0)
        };
    }

    const result = await getRecommendation();
    return {
        success: true,
        recommendations: {
            greeting: `Hello, ${studentContext.userName || 'Warrior'}!`,
            message: `You are enrolled in ${studentContext.enrolledCount || 0} course(s) with ${studentContext.totalXp || 0} XP so far.`,
            recommendation: result.recommendation,
            tip: 'Set one small learning goal for today and complete it before ending your day.',
            motivation: 'Consistent effort builds powerful transformation.'
        }
    };
}

// =============================================================
// FALLBACK RESPONSES
// =============================================================

function getFallbackResponse(message) {
    const lower = String(message || '').toLowerCase();

    if (lower.includes('recommend') || lower.includes('next') || lower.includes('what should')) {
        return "Based on your progress, I recommend exploring courses in Community Development or Communication Skills. Check out 'Community Development Methodologies' or 'Communication Skills' as strong next steps.";
    }

    if (lower.includes('tip') || lower.includes('study') || lower.includes('how to')) {
        const tips = [
            'Try the Pomodoro Technique: 25 minutes study, 5 minutes break.',
            'Take notes while learning. Writing helps memory retention.',
            'Find a study buddy. Learning with others boosts motivation.',
            'Apply what you learn to real-life situations.',
            'Review your notes before starting a new lesson.',
            'Set small daily goals. They are easier to achieve.',
            'Create a study schedule and stick to it.'
        ];
        return tips[Math.floor(Math.random() * tips.length)];
    }

    if (lower.includes('motivat') || lower.includes('encourage') || lower.includes('keep going')) {
        const name = studentContext.userName || 'Warrior';
        return `You are doing amazing, ${name}. Every lesson you complete moves you closer to becoming a Digital Warrior for Social Good. Keep going.`;
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        const name = studentContext.userName || 'Warrior';
        return `Hello ${name}. I am your AI Mentor. How can I help you with your learning today?`;
    }

    if (lower.includes('progress') || lower.includes('how am i')) {
        const enrolled = studentContext.enrolledCount || 0;
        const completed = studentContext.completedCount || 0;
        const xp = studentContext.totalXp || 0;
        return `You are enrolled in ${enrolled} courses and completed ${completed}. You have earned ${xp} XP so far. Keep up the great work.`;
    }

    if (lower.includes('thanks') || lower.includes('thank you')) {
        return 'You are welcome. I am here to help you succeed. Is there anything else you would like to know?';
    }

    if (lower.includes('course') || lower.includes('learn')) {
        return "We offer courses across multiple categories. I recommend starting with 'Communication Skills' or 'Introduction to Community Health'.";
    }

    return 'That is a great question. Check the lesson content for more detail, or ask me a specific course question for targeted help.';
}

// =============================================================
// EXPORTS (Global)
// =============================================================

window.AIService = {
    initAIService,
    sendAIMessage,
    getRecommendation,
    getLearningRecommendations,
    getStudentData
};

console.log('AI Service loaded for global use');
