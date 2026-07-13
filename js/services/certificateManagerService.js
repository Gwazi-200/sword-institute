import { db, collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from '../firebase.js';
import { getCurrentUser } from './authService.js';

const CERTIFICATE_COLLECTION = 'certificates';

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

async function getCertificateTemplates(uid) {
    const fallback = readFallback('certificates', []);
    try {
        const q = query(collection(db, CERTIFICATE_COLLECTION), where('createdBy', '==', uid || getCurrentUser()?.uid || 'anonymous'));
        const snapshot = await getDocs(q);
        const templates = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        writeFallback('certificates', templates);
        return templates;
    } catch (error) {
        return fallback;
    }
}

async function saveCertificateTemplate(payload) {
    const template = { ...payload, createdBy: getCurrentUser()?.uid || payload.createdBy || 'anonymous', createdAt: serverTimestamp() };
    try {
        const ref = await addDoc(collection(db, CERTIFICATE_COLLECTION), template);
        return { id: ref.id, ...template };
    } catch (error) {
        const next = [{ id: `${Date.now()}`, ...template }, ...readFallback('certificates', [])];
        writeFallback('certificates', next);
        return next[0];
    }
}

async function issueCertificate(payload) {
    return saveCertificateTemplate({ ...payload, status: 'issued' });
}

async function revokeCertificate(id) {
    try {
        const ref = doc(db, CERTIFICATE_COLLECTION, id);
        await updateDoc(ref, { status: 'revoked', updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        return false;
    }
}

export { getCertificateTemplates, saveCertificateTemplate, issueCertificate, revokeCertificate };
export default { getCertificateTemplates, saveCertificateTemplate, issueCertificate, revokeCertificate };
