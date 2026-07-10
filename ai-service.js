/**
 * ai-service.js
 * Sword Institute - Professor SWORD Service
 * Communicates with Firebase Cloud Functions
 */

import { auth as fbAuth, db as fbDb, storage as fbStorage, functions as fbFunctions, app as fbApp } from './firebase.js';
import { httpsCallable } from 'firebase/functions';

// =============================================================
// STATE
// =============================================================

let isInitialized = false;
let currentUser = null;
let lastResponseSource = 'fallback';
const OPENFRONTIER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENFRONTIER_MODEL = 'openai/gpt-3.5-turbo';


function resolveOpenFrontierApiKey() {
    const windowKey = typeof window !== 'undefined'
        ? (window.OPENFRONTIER_API_KEY || window.OPENROUTER_API_KEY || '')
        : '';

    const storageKey = typeof localStorage !== 'undefined'
        ? (localStorage.getItem('OPENFRONTIER_API_KEY') || localStorage.getItem('OPENROUTER_API_KEY') || '')
        : '';

    return windowKey || storageKey || '';
}

function hasLiveProvider() {
    const hasClientKey = Boolean(resolveOpenFrontierApiKey());
    const hasCallable = typeof firebase !== 'undefined' && !!firebase.functions;
    return hasClientKey || hasCallable;
}

// =============================================================
// INITIALIZATION
// =============================================================

function initAIService() {
    if (isInitialized) return true;

    if (typeof firebase === 'undefined') {
        console.warn('Firebase not loaded. AI service will use fallback responses.');
        return false;
    }

    const auth = firebase.auth();
    if (auth.currentUser) {
        currentUser = auth.currentUser;
    }

    auth.onAuthStateChanged((user) => {
        currentUser = user;
    });

    isInitialized = true;
    console.log('AI Service initialized with OpenFrontier AI');
    return true;
}

// =============================================================
// USER TOKEN
// =============================================================

async function getUserToken(forceRefresh = false) {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        return null;
    }

    if (!currentUser) {
        try {
            currentUser = firebase.auth().currentUser || null;
        } catch (error) {
            console.warn('Firebase auth is not ready yet. Falling back to guest AI mode.');
            return null;
        }
    }

    if (!currentUser || !currentUser.getIdToken) {
        return null;
    }

    try {
        return await currentUser.getIdToken(forceRefresh);
    } catch (error) {
        console.error('Failed to get user token:', error);
        return null;
    }
}

// =============================================================
// SEND AI MESSAGE
// =============================================================

async function sendAIMessageCore(message, context = 'General', lessonContent = '') {
    if (!message) return 'Please ask a question.';

    if (!isInitialized) {
        initAIService();
    }

    const userToken = await getUserToken();

    // Keep server-side callable for authenticated users.
    if (currentUser && userToken && typeof firebase !== 'undefined' && firebase.functions) {
        try {
            const functions = firebase.functions();
            const getAIResponse = functions.httpsCallable('getAIResponse');

            // Compatibility: accept object payload used by lesson/dashboard integrations.
            let normalizedLessonContent = lessonContent;
            if (lessonContent && typeof lessonContent === 'object') {
                const lessonCtx = lessonContent.lessonContext || {};
                normalizedLessonContent = lessonCtx.lessonSummary || '';
            }

            const result = await getAIResponse({
                message: message,
                context: context,
                lessonContent: normalizedLessonContent,
                userToken: userToken
            });

            if (result.data && result.data.success) {
                lastResponseSource = 'callable';
                return result.data.reply;
            }

            throw new Error('AI service returned an error');
        } catch (error) {
            console.error('Callable AI Error:', error);
        }
    }

    // For homepage guests, use direct async fetch with OpenFrontier/OpenRouter key.
    try {
        const reply = await callOpenFrontierDirect(message, context, lessonContent);
        lastResponseSource = 'direct';
        return reply;
    } catch (error) {
        console.error('Direct AI Error:', error);
        lastResponseSource = 'fallback';
        return getFallbackResponse(message);
    }
}

async function sendAIMessageLive(message, context = 'General', lessonContent = '') {
    const reply = await sendAIMessageCore(message, context, lessonContent);
    return {
        reply,
        live: isLastResponseLive(),
        source: getLastResponseSource()
    };
}

function getLastResponseSource() {
    return lastResponseSource;
}

function isLastResponseLive() {
    return lastResponseSource === 'callable' || lastResponseSource === 'direct';
}

async function callOpenFrontierDirect(message, context = 'Homepage', lessonContent = '') {
    const apiKey = resolveOpenFrontierApiKey();

    if (!apiKey) {
        throw new Error('OpenFrontier API key not configured on client');
    }

    let lessonSnippet = '';
    if (lessonContent && typeof lessonContent === 'string') {
        lessonSnippet = lessonContent.slice(0, 600);
    } else if (lessonContent && typeof lessonContent === 'object') {
        lessonSnippet = JSON.stringify(lessonContent).slice(0, 600);
    }

    const systemPrompt = [
        'You are Sword Institute Professor SWORD.',
        'Be concise, practical, warm, and encouraging.',
        'Keep most answers within 2-4 short sentences.',
        `Context: ${context || 'General'}`,
        lessonSnippet ? `Lesson context: ${lessonSnippet}` : ''
    ].filter(Boolean).join('\n');

    const response = await fetch(OPENFRONTIER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://sword-institute.web.app',
            'X-Title': 'Sword Institute Homepage Mentor'
        },
        body: JSON.stringify({
            model: OPENFRONTIER_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: String(message) }
            ],
            temperature: 0.7,
            max_tokens: 350
        })
    });

    if (!response.ok) {
        let details = '';
        try {
            const errData = await response.json();
            details = errData && errData.error ? `: ${errData.error.message || ''}` : '';
        } catch (parseErr) {
            details = '';
        }
        throw new Error(`OpenFrontier request failed (${response.status})${details}`);
    }

    const data = await response.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
        ? data.choices[0].message.content
        : '';

    if (!reply) {
        throw new Error('OpenFrontier returned empty reply');
    }

    return reply.trim();
}

// =============================================================
// GET AI RECOMMENDATION
// =============================================================

async function getRecommendation() {
    const userToken = await getUserToken();

    if (!currentUser || !userToken) {
        return {
            success: true,
            recommendation: "📚 I recommend starting with 'Communication Skills' or 'Introduction to Community Health'!"
        };
    }

    try {
        const getAIRecommendation = httpsCallable(fbFunctions, 'getAIRecommendation');


        const result = await getAIRecommendation({ userToken: userToken });

        if (result.data && result.data.success) {
            return result.data;
        }

        throw new Error('Recommendation service returned an error');
    } catch (error) {
        console.error('Recommendation Error:', error);
        return {
            success: true,
            recommendation: "📚 I recommend exploring 'Communication Skills' or 'Community Development Methodologies' - they're great for building a strong foundation!"
        };
    }
}

// Backward-compatible API used by dashboard page.
async function getLearningRecommendations(studentData = {}) {
    const result = await getRecommendation();
    const recommendationText = result.recommendation || 'Explore the course catalogue for your next learning step.';

    const userName = (studentData && studentData.userName) || 'Warrior';
    const enrolledCount = Array.isArray(studentData.enrolledCourses) ? studentData.enrolledCourses.length : 0;
    const totalXp = typeof studentData.totalXp === 'number' ? studentData.totalXp : 0;

    return {
        success: true,
        recommendations: {
            greeting: `Hello, ${userName}!`,
            message: `You are enrolled in ${enrolledCount} course(s) with ${totalXp} XP so far.`,
            recommendation: recommendationText,
            tip: 'Set one small study target for today and complete it before ending your day.',
            motivation: 'Consistent effort creates real transformation.'
        }
    };
}

// =============================================================
// FALLBACK RESPONSES
// =============================================================

function getFallbackResponse(message) {
    const lower = String(message).toLowerCase();

    if (lower.includes('recommend') || lower.includes('next')) {
        return "🎯 Based on your progress, I recommend exploring courses in Community Development or Communication Skills. Check out 'Community Development Methodologies' or 'Communication Skills' as great next steps!";
    }

    if (lower.includes('tip') || lower.includes('study')) {
        const tips = [
            '🍅 Try the Pomodoro Technique: 25 minutes study, 5 minutes break!',
            '📝 Take notes while learning - writing helps memory retention.',
            '👥 Find a study buddy - learning with others boosts motivation.',
            '🌍 Apply what you learn to real-life situations.',
            '🔄 Review your notes before starting a new lesson.'
        ];
        return tips[Math.floor(Math.random() * tips.length)];
    }

    if (lower.includes('motivat') || lower.includes('encourage')) {
        return '🌟 You are doing amazing! Every lesson you complete brings you closer to becoming a Digital Warrior for Social Good. Keep going! 💪';
    }

    if (lower.includes('hello') || lower.includes('hi')) {
        return '👋 Hello! I am Professor SWORD. How can I help you with your learning today?';
    }

    if (lower.includes('progress')) {
        return '📊 Check your dashboard to see your progress! You can view your enrolled courses, completed lessons, and XP there.';
    }

    if (lower.includes('thanks') || lower.includes('thank')) {
        return "You're welcome! 🌟 I'm here to help you succeed. Is there anything else you'd like to know?";
    }

    return "🌟 That's a great question! I'd recommend checking the lesson content for more details, or exploring our course catalogue to find courses that interest you.";
}

// =============================================================
// EXPORTS
// =============================================================

// For script tag usage
if (typeof window !== 'undefined') {
    window.AIService = {
        initAIService,
        hasLiveProvider,
        getLastResponseSource,
        isLastResponseLive,
        sendAIMessageLive,
        sendAIMessage: sendAIMessageCore,
        getRecommendation,
        getLearningRecommendations,
        getUserToken
    };
    console.log('AI Service loaded for global use');
}
