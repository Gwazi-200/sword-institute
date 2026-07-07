/**
 * Firebase Cloud Functions - Sword Institute Professor SWORD
 * Securely handles OpenFrontier AI API calls
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// =============================================================
// OPENFRONTIER AI API KEY (FROM ENV / FUNCTIONS CONFIG)
// =============================================================
const OPENFRONTIER_API_KEY =
    (functions.config().openfrontier && functions.config().openfrontier.key) ||
    process.env.OPENFRONTIER_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    '';

const AI_CONFIG = {
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openai/gpt-3.5-turbo',
    fallbackModel: 'mistralai/mistral-7b-instruct',
    maxTokens: 500,
    temperature: 0.7,
};

// =============================================================
// 1. GET AI RESPONSE (Main Function)
// =============================================================

exports.getAIResponse = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in to use Professor SWORD.'
        );
    }

    const { message, context: userContext, lessonContent } = data || {};

    if (!message) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Message is required.'
        );
    }

    if (!OPENFRONTIER_API_KEY) {
        throw new functions.https.HttpsError(
            'failed-precondition',
            'AI service key is not configured.'
        );
    }

    let studentName = 'Warrior';

    try {
        // Get student data
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(context.auth.uid)
            .get();

        const userData = userDoc.data() || {};
        studentName = userData.displayName || userData.name || studentName;

        // Get enrollments
        const enrollmentsSnapshot = await admin.firestore()
            .collection('enrollments')
            .where('userId', '==', context.auth.uid)
            .where('status', '==', 'active')
            .get();

        let enrolledCount = 0;
        let completedCount = 0;
        let totalXp = 0;

        enrollmentsSnapshot.forEach((doc) => {
            const enrollment = doc.data();
            enrolledCount += 1;
            if (enrollment.completed) completedCount += 1;
            if (enrollment.xpEarned) totalXp += enrollment.xpEarned;
        });

        // Build system prompt
        let systemPrompt = `You are Professor SWORD for Sword Institute, a community development and social work learning platform.

STUDENT INFORMATION:
- Name: ${studentName}
- Enrolled Courses: ${enrolledCount}
- Completed Courses: ${completedCount}
- Total XP: ${totalXp}

Your role is to:
1. Be warm, encouraging, and supportive
2. Provide personalized learning advice
3. Help students understand course content
4. Motivate and inspire continued learning
5. Keep responses concise (2-3 sentences for quick answers)

Tone: Wise, compassionate, and empowering. Use emojis occasionally.

Current Context: ${userContext || 'General learning support'}`;

        if (lessonContent) {
            systemPrompt += `\n\nLESSON CONTENT: ${String(lessonContent).substring(0, 800)}...\n\nHelp the student understand this lesson content and answer their question.`;
        }

        // Call OpenFrontier AI (primary)
        const response = await fetch(AI_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENFRONTIER_API_KEY}`,
                'HTTP-Referer': 'https://sword-institute.web.app',
                'X-Title': 'Sword Institute LMS'
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                max_tokens: AI_CONFIG.maxTokens,
                temperature: AI_CONFIG.temperature,
            })
        });

        if (!response.ok) {
            const errorData = await safeJson(response);
            console.error('AI API Error:', errorData);

            // Try fallback model
            const fallbackResponse = await fetch(AI_CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENFRONTIER_API_KEY}`,
                    'HTTP-Referer': 'https://sword-institute.web.app',
                    'X-Title': 'Sword Institute LMS'
                },
                body: JSON.stringify({
                    model: AI_CONFIG.fallbackModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    max_tokens: AI_CONFIG.maxTokens,
                    temperature: AI_CONFIG.temperature,
                })
            });

            if (!fallbackResponse.ok) {
                throw new Error('Both primary and fallback models failed');
            }

            const fallbackData = await fallbackResponse.json();
            const reply = fallbackData?.choices?.[0]?.message?.content || getFallbackResponse(message, studentName);

            // Log interaction
            await admin.firestore().collection('ai_interactions').add({
                userId: context.auth.uid,
                message,
                reply,
                context: userContext || 'General',
                model: AI_CONFIG.fallbackModel,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, reply };
        }

        const responseData = await response.json();
        const reply = responseData?.choices?.[0]?.message?.content || getFallbackResponse(message, studentName);

        // Log interaction
        await admin.firestore().collection('ai_interactions').add({
            userId: context.auth.uid,
            message,
            reply,
            context: userContext || 'General',
            model: AI_CONFIG.model,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, reply };

    } catch (error) {
        console.error('AI Error:', error);
        // Return a friendly fallback response
        return {
            success: true,
            reply: getFallbackResponse(message, studentName)
        };
    }
});

// =============================================================
// 2. GET AI RECOMMENDATION
// =============================================================

exports.getAIRecommendation = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in.'
        );
    }

    try {
        // Get student enrollments
        const enrollmentsSnapshot = await admin.firestore()
            .collection('enrollments')
            .where('userId', '==', context.auth.uid)
            .where('status', '==', 'active')
            .get();

        const enrollments = [];
        enrollmentsSnapshot.forEach((doc) => {
            enrollments.push({ id: doc.id, ...doc.data() });
        });

        const completed = enrollments.filter((e) => e.completed);
        const enrolledIds = enrollments.map((e) => e.courseId);

        // Get all available courses
        const coursesSnapshot = await admin.firestore()
            .collection('courses')
            .orderBy('order', 'asc')
            .get();

        const allCourses = [];
        coursesSnapshot.forEach((doc) => {
            allCourses.push({ id: doc.id, ...doc.data() });
        });

        const available = allCourses.filter((c) => !enrolledIds.includes(c.id));

        let recommendation = '';

        if (available.length === 0) {
            recommendation = "🌟 You've completed all available courses! Check back soon for new content.";
        } else if (completed.length === 0 && enrollments.length === 0) {
            recommendation = `📚 I recommend starting with "${available[0]?.title || 'the first available course'}" - it's a great foundation for your learning journey!`;
        } else if (completed.length === 0 && enrollments.length > 0) {
            recommendation = "💪 Focus on completing your current courses before starting new ones. You're doing great!";
        } else {
            // Find recommended course by category priority
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
                recommendation = `🎯 Based on your progress, I recommend "${recommended.title}" - it's a great next step!`;
            } else {
                recommendation = '📚 Explore our course catalogue to find your next learning path!';
            }
        }

        return {
            success: true,
            recommendation,
            availableCourses: available.length,
            completedCourses: completed.length,
            enrolledCourses: enrollments.length
        };

    } catch (error) {
        console.error('Recommendation Error:', error);
        return {
            success: false,
            error: 'Could not generate recommendation. Please try again.'
        };
    }
});

// =============================================================
// 3. FALLBACK RESPONSES
// =============================================================

function getFallbackResponse(message, studentName) {
    const lower = String(message || '').toLowerCase();

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
        return `🌟 You're doing amazing, ${studentName}! Every lesson you complete brings you closer to becoming a Digital Warrior for Social Good. Keep going! 💪`;
    }

    if (lower.includes('hello') || lower.includes('hi')) {
        return `👋 Hello ${studentName}! I'm Professor SWORD. How can I help you with your learning today?`;
    }

    if (lower.includes('progress')) {
        return '📊 Check your dashboard to see your progress! You can view your enrolled courses, completed lessons, and XP there.';
    }

    if (lower.includes('thanks') || lower.includes('thank')) {
        return "You're welcome! 🌟 I'm here to help you succeed. Is there anything else you'd like to know?";
    }

    return "🌟 That's a great question! I'd recommend checking the lesson content for more details, or exploring our course catalogue to find courses that interest you.";
}

async function safeJson(response) {
    try {
        return await response.json();
    } catch (error) {
        return { error: 'Failed to parse response body' };
    }
}
