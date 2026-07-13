import { db, collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from '../firebase.js';
import { getCurrentUser } from './authService.js';

const ASSESSMENT_COLLECTION = 'assessments';
const QUESTION_BANK_COLLECTION = 'question_bank';

function buildStorageKey(key) {
    return `instructor-studio:${key}`;
}

function readFallback(key, fallback) {
    try {
        const raw = window.localStorage.getItem(buildStorageKey(key));
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeFallback(key, value) {
    try {
        window.localStorage.setItem(buildStorageKey(key), JSON.stringify(value));
    } catch (error) {
        // Ignore storage errors and continue.
    }
}

async function getAssessments(uid, forceRefresh = false) {
    const userId = uid || getCurrentUser()?.uid || 'anonymous';
    const fallback = readFallback('assessments', []);
    if (!forceRefresh && fallback.length) {
        return fallback;
    }

    try {
        const q = query(collection(db, ASSESSMENT_COLLECTION), where('createdBy', '==', userId));
        const snapshot = await getDocs(q);
        const assessments = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        writeFallback('assessments', assessments);
        return assessments;
    } catch (error) {
        return fallback;
    }
}

async function createAssessment(payload) {
    const assessment = {
        ...payload,
        createdBy: getCurrentUser()?.uid || payload.createdBy || 'anonymous',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    try {
        const ref = await addDoc(collection(db, ASSESSMENT_COLLECTION), assessment);
        return { id: ref.id, ...assessment };
    } catch (error) {
        const next = [{ id: `${Date.now()}`, ...assessment }, ...readFallback('assessments', [])];
        writeFallback('assessments', next);
        return next[0];
    }
}

async function createQuestionBankEntry(payload) {
    const entry = { ...payload, createdAt: serverTimestamp() };
    try {
        const ref = await addDoc(collection(db, QUESTION_BANK_COLLECTION), entry);
        return { id: ref.id, ...entry };
    } catch (error) {
        return entry;
    }
}

export { getAssessments, createAssessment, createQuestionBankEntry };
export default { getAssessments, createAssessment, createQuestionBankEntry };
