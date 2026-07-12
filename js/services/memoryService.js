import { getStudentProfile, updateStudentProfile } from './studentProfileService.js';

export async function saveConversationTurn(uid, message, role = 'student') {
    const profile = await getStudentProfile(uid, { force: true });
    const memory = profile?.professorMemory || {
        conversations: [],
        favouriteSubjects: [],
        weakTopics: [],
        strongTopics: [],
        studySchedule: [],
        personalGoals: []
    };
    const conversations = [...(memory.conversations || []), { role, message, createdAt: new Date().toISOString() }].slice(-12);
    await updateStudentProfile(uid, {
        professorMemory: {
            ...memory,
            conversations,
        },
    });
    return conversations;
}

export async function getProfessorMemory(uid) {
    const profile = await getStudentProfile(uid, { force: true });
    return profile?.professorMemory || {
        conversations: [],
        favouriteSubjects: [],
        weakTopics: [],
        strongTopics: [],
        studySchedule: [],
        personalGoals: []
    };
}

export default { saveConversationTurn, getProfessorMemory };
