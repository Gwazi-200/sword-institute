/**
 * ai-service.js
 * Sword Institute - AI Mentor Service
 * Communicates with Firebase Cloud Functions
 */

// =============================================================
// STATE
// =============================================================

let isInitialized = false;
let currentUser = null;

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
        currentUser = firebase.auth().currentUser || null;
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

async function sendAIMessage(message, context = 'General', lessonContent = '') {
    if (!message) return 'Please ask a question.';

    if (!isInitialized) {
        initAIService();
    }

    const userToken = await getUserToken();

    if (!currentUser || !userToken) {
        return getFallbackResponse(message);
    }

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
            return result.data.reply;
        }

        throw new Error('AI service returned an error');
    } catch (error) {
        console.error('AI Error:', error);
        return getFallbackResponse(message);
    }
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
        const functions = firebase.functions();
        const getAIRecommendation = functions.httpsCallable('getAIRecommendation');

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
        return '👋 Hello! I am your AI Mentor. How can I help you with your learning today?';
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
        sendAIMessage,
        getRecommendation,
        getLearningRecommendations,
        getUserToken
    };
    console.log('AI Service loaded for global use');
}
