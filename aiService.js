/**
 * aiService.js
 * Sword Institute LMS - AI Mentor Service
 * Handles AI-powered learning recommendations
 */

// =============================================================
// AI Mentor Service
// =============================================================

/**
 * Get AI-powered learning recommendations for a student
 * @param {Object} studentData - Student progress data
 * @param {Array} studentData.enrolledCourses - Courses the student is enrolled in
 * @param {Array} studentData.completedCourses - Courses the student has completed
 * @param {number} studentData.totalXp - Total XP earned
 * @param {Array} studentData.availableCourses - All available courses
 * @returns {Promise<Object>} - AI recommendations
 */
export async function getAIRecommendations(studentData) {
    try {
        // Build the AI prompt based on student data
        const prompt = buildAIPrompt(studentData);
        
        // Call AI API (using a Cloud Function or direct API call)
        const response = await callAIApi(prompt);
        
        return {
            success: true,
            recommendations: response
        };
    } catch (error) {
        console.error('Error getting AI recommendations:', error);
        // Return fallback recommendations
        return getFallbackRecommendations(studentData);
    }
}

/**
 * Build the AI prompt based on student data
 */
function buildAIPrompt(studentData) {
    const enrolledCount = studentData.enrolledCourses?.length || 0;
    const completedCount = studentData.completedCourses?.length || 0;
    const totalXp = studentData.totalXp || 0;
    const availableCourses = studentData.availableCourses || [];
    
    // Get course titles
    const enrolledTitles = studentData.enrolledCourses?.map(c => c.title).join(', ') || 'None';
    const completedTitles = studentData.completedCourses?.map(c => c.title).join(', ') || 'None';
    
    return `
You are a wise and compassionate AI Mentor for Sword Institute, a community development and social work learning platform.

STUDENT DATA:
- Enrolled Courses: ${enrolledTitles}
- Completed Courses: ${completedTitles}
- Total XP Earned: ${totalXp}
- Enrolled Count: ${enrolledCount}
- Completed Count: ${completedCount}
- Available Courses: ${availableCourses.map(c => c.title).join(', ')}

TASK:
Provide personalized learning advice for this student in the following format (return as JSON):

{
    "greeting": "A warm, personalized greeting using their name (if available, otherwise just say 'Warrior')",
    "message": "A 2-3 sentence message about their progress and next steps",
    "recommendation": "Recommend 1-2 specific courses they should take next based on their progress and interests",
    "tip": "A practical study tip or learning strategy",
    "motivation": "A motivational message to keep them going"
}

Make it warm, encouraging, and personalized. Be specific about course recommendations.
`;
}

/**
 * Call AI API (OpenAI or Claude)
 */
async function callAIApi(prompt) {
    // Option 1: Using a Firebase Cloud Function (Recommended for security)
    // Option 2: Direct API call (for testing)
    
    // For now, we'll use a mock response
    // You can replace this with actual API calls later
    
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development' || true) {
        // Return mock response for testing
        return getMockAIResponse();
    }
    
    // Actual API call (when you're ready)
    // const response = await fetch('YOUR_CLOUD_FUNCTION_URL', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ prompt })
    // });
    // return await response.json();
}

/**
 * Get mock AI response for testing
 */
function getMockAIResponse() {
    const responses = [
        {
            greeting: "Hello, Warrior of Light! 🌟",
            message: "You're making excellent progress on your learning journey. Your dedication to community development is inspiring.",
            recommendation: "Based on your progress, I recommend exploring 'Community Development Methodologies' next to build on your foundation.",
            tip: "Try the 'Pomodoro Technique' - study for 25 minutes, then take a 5-minute break. It helps with focus!",
            motivation: "Remember: Every master was once a beginner. Keep going, you're doing great!"
        },
        {
            greeting: "Welcome back, Seeker of Wisdom! 📚",
            message: "Your commitment to learning is truly admirable. Let's take your skills to the next level.",
            recommendation: "Since you're interested in social work, I suggest 'Social Work Theory and Practice' as your next course.",
            tip: "Take notes while you learn - writing things down helps with memory retention.",
            motivation: "The journey of a thousand miles begins with a single step. You're on the right path!"
        },
        {
            greeting: "Greetings, Future Changemaker! ✨",
            message: "Your progress shows you're serious about making a difference in your community.",
            recommendation: "Consider 'Management of Community Concerns' to develop practical leadership skills.",
            tip: "Find a study buddy - learning with others can boost your motivation and understanding.",
            motivation: "Your community needs leaders like you. Keep pushing forward!"
        },
        {
            greeting: "Well met, Community Champion! 🏛️",
            message: "I see you've been exploring our courses with purpose and dedication.",
            recommendation: "Based on your interests, 'Community Based Organisation (CBO)' would be a great next step.",
            tip: "Apply what you learn to real-life situations - it makes the knowledge stick.",
            motivation: "The world changes because of people like you who refuse to stay still."
        },
        {
            greeting: "Hello, Sacred Learner! 🕯️",
            message: "Your dedication to understanding human development is truly special.",
            recommendation: "I recommend 'Human Growth and Development' to deepen your understanding of the lifespan.",
            tip: "Reflect on how each lesson connects to your personal experiences.",
            motivation: "Every lesson you complete plants a seed of change in the world."
        }
    ];
    
    // Return a random response
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Fallback recommendations if AI fails
 */
function getFallbackRecommendations(studentData) {
    const enrolledCount = studentData.enrolledCourses?.length || 0;
    const completedCount = studentData.completedCourses?.length || 0;
    
    let message = '';
    let recommendation = '';
    let tip = '';
    let motivation = '';
    
    if (enrolledCount === 0) {
        message = "Welcome to Sword Institute! Your learning journey awaits.";
        recommendation = "Start with 'Introduction to Community Development' or 'Communication Skills'.";
        tip = "Start with the 'Beginner' level courses to build your foundation.";
        motivation = "The first step is always the hardest - but you've already taken it!";
    } else if (completedCount === 0 && enrolledCount > 0) {
        message = "You're enrolled in courses! Complete your first lesson to start earning XP.";
        recommendation = "Focus on completing one course at a time for best results.";
        tip = "Set aside 15-20 minutes each day for learning - consistency is key!";
        motivation = "Small steps lead to big changes. Keep going!";
    } else if (completedCount < enrolledCount) {
        message = `You've completed ${completedCount} courses! Keep up the momentum.`;
        recommendation = "Complete your current courses before starting new ones.";
        tip = "Review your completed lessons to reinforce your learning.";
        motivation = "You're on a roll! Don't stop now!";
    } else if (completedCount > 0 && completedCount === enrolledCount) {
        message = "You've completed all your enrolled courses! Time to explore new paths.";
        recommendation = "Explore courses in new categories to broaden your skills.";
        tip = "Try applying what you've learned to a real community project.";
        motivation = "You're a learning machine! Keep expanding your horizons.";
    } else {
        message = "Welcome back to Sword Institute!";
        recommendation = "Explore our course catalogue to find your next learning path.";
        tip = "Check your dashboard to track your progress.";
        motivation = "Every moment is an opportunity to learn something new.";
    }
    
    return {
        greeting: "Hello, Seeker of Knowledge! 🌟",
        message: message,
        recommendation: recommendation,
        tip: tip,
        motivation: motivation
    };
}

// Export functions
export default {
    getAIRecommendations,
    getFallbackRecommendations
};