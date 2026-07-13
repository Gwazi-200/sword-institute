import { getStudentProfile, updateStudentProfile } from './studentProfileService.js';
import { read, write } from './storageService.js';
import { trackEvent } from './loggingService.js';

const GAMIFICATION_STORAGE_KEY = 'gamification';

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
    const state = read(GAMIFICATION_STORAGE_KEY, { xp: 0, streak: 0, badges: [] });
    write(GAMIFICATION_STORAGE_KEY, { ...state, xp: (state.xp || 0) + points });
    trackEvent('award_xp', { uid, points, reason });
    return nextXp;
}

export function getStoredGamificationState() {
    return read(GAMIFICATION_STORAGE_KEY, { xp: 0, streak: 0, badges: [] });
}

export default { getGamificationState, awardXp, getStoredGamificationState };
