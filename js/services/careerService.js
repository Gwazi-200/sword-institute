import { getStudentProfile } from './studentProfileService.js';

export async function getCareerRecommendations(uid) {
    const profile = await getStudentProfile(uid, { force: true });
    const skills = (profile?.achievements || []).map((item) => item?.name || item).join(' ');
    const goal = profile?.careerGoal || 'professional growth';
    const completed = (profile?.completedCourses || []).map((item) => item?.title || item?.id || '').filter(Boolean);

    const recommendations = [
        { title: 'NGO Project Officer', reason: 'Community-focused learning and completed coursework align well.' },
        { title: 'Community Development Officer', reason: `Your goals around ${goal} fit this path.` },
        { title: 'Office Administrator', reason: 'Structured progress and completed learning activities support this role.' },
    ];

    if (skills.toLowerCase().includes('ai')) {
        recommendations.unshift({ title: 'AI Prompt Engineer', reason: 'Your AI-related learning suggests strong fit for prompt-driven work.' });
    }

    if (completed.length) {
        recommendations.unshift({ title: 'Social Research Assistant', reason: `Your completed courses in ${completed[0]} suggest a research-focused path.` });
    }

    return recommendations.slice(0, 4);
}

export async function getPortfolioSnapshot(uid) {
    const profile = await getStudentProfile(uid, { force: true });
    return {
        certificates: profile?.certificates || [],
        completedCourses: profile?.completedCourses || [],
        achievements: profile?.achievements || [],
        badges: profile?.badges || [],
        careerGoal: profile?.careerGoal || 'Professional growth',
    };
}

export default { getCareerRecommendations, getPortfolioSnapshot };