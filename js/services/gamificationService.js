import { getStudentProfile, updateStudentProfile } from './studentProfileService.js';

export async function getGamificationState(uid) {
    const profile = await getStudentProfile(uid, { force: true });
    const xp = Number(profile?.xp || 0);
    const level = Math.max(1, Math.floor(xp / 400) + 1);
    const nextLevelXp = level * 400;
    return {
        xp,
        level,
        nextLevelXp,
        percentToNextLevel: Math.min(100, Math.round((xp % 400) / 400 * 100)),
        badges: profile?.badges || [],
        achievements: profile?.achievements || [],
        challenges: [
            { title: 'Daily Study', detail: 'Spend a focused 30 minutes learning' },
            { title: 'Weekly Reflection', detail: 'Review one bookmarked resource' },
        ],
    };
}

export async function awardXp(uid, points, reason = 'Progress') {
    const profile = await getStudentProfile(uid, { force: true });
    const nextXp = Number(profile?.xp || 0) + points;
    await updateStudentProfile(uid, {
        xp: nextXp,
        level: Math.max(1, Math.floor(nextXp / 400) + 1),
        achievements: Array.isArray(profile?.achievements) ? profile.achievements : [],
    });
    return nextXp;
}

export default { getGamificationState, awardXp };
