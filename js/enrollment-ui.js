// enrollment-ui.js
// Shared enrollment + navigation gating helpers.
// Assumes Firebase compat is loaded on the page:
//  - firebase.initializeApp(...)
//  - firebase.auth()
//  - firebase.firestore()
//
// Firestore assumptions (based on existing dashboard.html):
//  - enrollments collection
//  - fields: userId, courseId, status ('active'|'inactive'), completed (bool), xpEarned (number), progress (number)

(function () {
  function getFirestoreCompat() {
    try {
      if (window.firebase && window.firebase.firestore) return window.firebase.firestore();
    } catch (_) {
      // ignore
    }
    return null;
  }

  async function hasActiveEnrollment(userId) {
    if (!userId) return false;
    const db = getFirestoreCompat();
    if (!db) return false;

    const snapshot = await db
      .collection('enrollments')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    return !snapshot.empty;
  }

  async function getActiveEnrollmentDoc(userId, courseId) {
    const db = getFirestoreCompat();
    if (!db || !userId || !courseId) return null;

    const snapshot = await db
      .collection('enrollments')
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  async function enrollUserInCourse({ userId, courseId }) {
    if (!userId || !courseId) throw new Error('Missing userId or courseId');

    const db = getFirestoreCompat();
    if (!db) throw new Error('Firestore is not available');

    // Use deterministic doc id so repeated enroll calls do not duplicate.
    const docId = `${userId}__${courseId}`;
    const docRef = db.collection('enrollments').doc(docId);

    const now = Date.now();

    const payload = {
      userId,
      courseId,
      status: 'active',
      completed: false,
      progress: 0,
      xpEarned: 0,
      createdAt: now,
      updatedAt: now
    };

    await docRef.set(payload, { merge: true });

    return { docId, ...payload };
  }

  // Navigation: toggle dashboard link based on auth + enrollment.
  // Expects:
  //  - dashboard button element(s)
  //  - (optional) dashboardRoute element
  async function updateDashboardNav({ dashboardButtonSelector = '#dashboardBtn', user }) {
    const btn = document.querySelector(dashboardButtonSelector);
    if (!btn) return;

    // Hide while checking.
    btn.classList.add('hidden-dashboard-btn');

    if (!user) {
      btn.style.display = 'none';
      return;
    }

    const enrolled = await hasActiveEnrollment(user.uid);

    if (enrolled) {
      btn.style.display = 'inline-flex';
    } else {
      btn.style.display = 'none';
    }
  }

  window.EnrollmentUI = {
    hasActiveEnrollment,
    getActiveEnrollmentDoc,
    enrollUserInCourse,
    updateDashboardNav
  };
})();

