// session-utils.js
// Small helpers for consistent userSession shape.

(function () {
  const KEY = (window.STORAGE_KEYS && window.STORAGE_KEYS.session) ? window.STORAGE_KEYS.session : 'sword_session';

  function safeParse(json, fallback) {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  function getUserSession() {
    return safeParse(localStorage.getItem(KEY), null);
  }

  function saveUserSession(session) {
    if (!session) {
      localStorage.removeItem(KEY);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(session));
  }

  window.SessionUtils = {
    getUserSession,
    saveUserSession
  };
})();

