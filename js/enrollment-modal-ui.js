/*
  enrollment-modal-ui.js
  Handles enrollment modal rendering/behavior for courses.html.

  This script is intentionally dependency-light:
  - Requires window.EnrollmentUI.enrollUserInCourse({userId, courseId})
  - Requires courses.html to define getSession/saveSession if we want session persistence.

  If those functions are not present, it falls back to localStorage keys.
*/

(function () {
  function getStorageKeys() {
    return (window.STORAGE_KEYS && typeof window.STORAGE_KEYS === 'object')
      ? window.STORAGE_KEYS
      : { session: 'sword_session' };
  }

  function safeParse(json, fallback) {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  function getSessionFallback() {
    const { session } = getStorageKeys();
    return safeParse(localStorage.getItem(session), null);
  }

  function saveSessionFallback(session) {
    const { session } = getStorageKeys();
    localStorage.setItem(session ? session : null, null);
    localStorage.setItem(session, JSON.stringify(session));
  }

  function getSessionApi() {
    // Prefer page-defined helpers if present.
    if (typeof window.getSession === 'function') return { get: window.getSession };
    return { get: getSessionFallback };
  }

  function saveSessionApi() {
    if (typeof window.saveSession === 'function') return { save: window.saveSession };
    return {
      save: (s) => {
        const { session } = getStorageKeys();
        if (!s) {
          localStorage.removeItem(session);
          return;
        }
        localStorage.setItem(session, JSON.stringify(s));
      }
    };
  }

  function getOrCreateModalEls() {
    const modal = document.getElementById('enrollmentModal');
    if (!modal) return null;

    const form = modal.querySelector('#enrollmentForm');
    const closeBtn = modal.querySelector('[data-close-modal="enrollmentModal"]');

    return { modal, form, closeBtn };
  }

  function openEnrollmentModal(courseId, courseTitle) {
    const els = getOrCreateModalEls();
    if (!els) return;

    els.modal.classList.add('show');
    els.modal.setAttribute('aria-hidden', 'false');

    const titleEl = els.modal.querySelector('#enrollmentCourseTitle');
    if (titleEl) titleEl.textContent = courseTitle || 'Course';

    const courseIdInput = els.modal.querySelector('#enrollmentCourseId');
    if (courseIdInput) courseIdInput.value = courseId || '';
  }

  function closeEnrollmentModal() {
    const els = getOrCreateModalEls();
    if (!els) return;

    els.modal.classList.remove('show');
    els.modal.setAttribute('aria-hidden', 'true');
  }

  function normalizePhone(phone) {
    return String(phone || '').trim().replace(/\s+/g, '');
  }

  function validateEnrollmentForm({ admissionNumber, name, phone }) {
    const errs = [];
    if (!String(admissionNumber || '').trim()) errs.push('Admission Number is required.');
    if (!String(name || '').trim()) errs.push('Name is required.');
    const p = normalizePhone(phone);
    if (!p) errs.push('Phone Number is required.');
    if (p && !/^[0-9+().\-\s]{7,}$/.test(p)) errs.push('Enter a valid Phone Number.');

    return { ok: errs.length === 0, errors: errs };
  }

  function persistUserSessionFields({ admissionNumber, name, phone, courseId, userId, email }) {
    // Prefer the shared session-utils (if available). Otherwise fall back to page helpers/localStorage.
    const existing = window.SessionUtils && typeof window.SessionUtils.getUserSession === 'function'
      ? window.SessionUtils.getUserSession() || {}
      : ((getSessionApi().get && getSessionApi().get()) || {});

    const next = {
      ...(existing && typeof existing === 'object' ? existing : {}),
      admissionNumber: String(admissionNumber || '').trim(),
      name: String(name || '').trim(),
      phone: normalizePhone(phone),
      course: String(courseId || ''),
      userId: userId || existing.userId || null,
      email: email || existing.email || null,
      updatedAt: Date.now()
    };

    if (window.SessionUtils && typeof window.SessionUtils.saveUserSession === 'function') {
      window.SessionUtils.saveUserSession(next);
    } else {
      const { save } = saveSessionApi();
      save(next);
    }

    return next;
  }


  async function submitEnrollmentFromModal({ currentUser, onSuccess }) {
    const els = getOrCreateModalEls();
    if (!els || !els.form) return;

    const courseId = els.modal.querySelector('#enrollmentCourseId')?.value;
    const admissionNumber = els.modal.querySelector('#admissionNumber')?.value;
    const name = els.modal.querySelector('#learnerName')?.value;
    const phone = els.modal.querySelector('#learnerPhone')?.value;

    const v = validateEnrollmentForm({ admissionNumber, name, phone });
    if (!v.ok) {
      const errBox = els.modal.querySelector('#enrollmentFormError');
      if (errBox) errBox.textContent = v.errors[0];
      return;
    }

    const errBox = els.modal.querySelector('#enrollmentFormError');
    if (errBox) errBox.textContent = '';

    const submitBtn = els.modal.querySelector('#enrollmentSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.dataset.originalText || submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enrolling...';
    }

    try {
      if (!currentUser || !currentUser.uid) throw new Error('Login required.');
      if (!courseId) throw new Error('Course ID missing.');

      if (!window.EnrollmentUI || typeof window.EnrollmentUI.enrollUserInCourse !== 'function') {
        throw new Error('Enrollment service unavailable.');
      }

      await window.EnrollmentUI.enrollUserInCourse({ userId: currentUser.uid, courseId });

      // Persist to userSession/localStorage as requested.
      persistUserSessionFields({
        admissionNumber,
        name,
        phone,
        courseId,
        userId: currentUser.uid,
        email: currentUser.email
      });

      if (typeof onSuccess === 'function') onSuccess({ courseId });
      closeEnrollmentModal();
    } catch (e) {
      const errBox2 = els.modal.querySelector('#enrollmentFormError');
      if (errBox2) errBox2.textContent = e?.message || 'Enrollment failed. Please try again.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        if (submitBtn.dataset.originalText) submitBtn.innerHTML = submitBtn.dataset.originalText;
      }
    }
  }

  function bindEnrollmentModalEvents({ getCurrentUser, onSuccess }) {
    const els = getOrCreateModalEls();
    if (!els) return;

    if (els.closeBtn) {
      els.closeBtn.addEventListener('click', closeEnrollmentModal);
    }

    els.modal.addEventListener('click', (e) => {
      if (e.target === els.modal) closeEnrollmentModal();
    });

    if (els.form) {
      els.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentUser = getCurrentUser ? getCurrentUser() : null;
        submitEnrollmentFromModal({ currentUser, onSuccess });
      });
    }
  }

  window.EnrollmentModalUI = {
    openEnrollmentModal,
    closeEnrollmentModal,
    bindEnrollmentModalEvents
  };
})();

