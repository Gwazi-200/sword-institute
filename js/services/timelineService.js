import { db, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from '../firebase.js';
import { updateStudentProfile } from './studentProfileService.js';

export async function logTimelineEvent(uid, eventType, payload = {}) {
    if (!uid) return null;
    const eventsRef = collection(db, 'student_timeline', uid, 'events');
    const event = {
        eventType,
        payload,
        createdAt: serverTimestamp(),
    };
    await addDoc(eventsRef, event);
    await updateStudentProfile(uid, { lastLogin: serverTimestamp() });
    return event;
}

export async function getTimeline(uid, limitCount = 8) {
    if (!uid) return [];
    const eventsRef = collection(db, 'student_timeline', uid, 'events');
    const q = query(eventsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export default { logTimelineEvent, getTimeline };
