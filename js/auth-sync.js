/**
 * Sword Auth Sync
 * Centralizes modular Firebase auth state updates.
 *
 * Optional page hooks (if defined by the page):
 *   - window.updateNav?.()
 *   - window.unlockCourses?.()
 *   - window.onAuthUserChanged?.(user)
 *
 * Also exposes a safe snapshot at window.SwordSession.
 */

import { auth, onAuthStateChanged } from './firebase.js';

(function registerGlobal() {
  if (window.SwordAuthSync) return; // prevent double registration

  const setSession = (user) => {
    window.SwordSession = {
      isLoggedIn: !!user,
      userId: user?.uid || null,
      email: user?.email || null,
      displayName: user?.displayName || null,
      updatedAt: Date.now()
    };
  };

  const callHooks = (user) => {
    try {
      if (typeof window.updateNav === 'function') window.updateNav();
    } catch (_) {}

    try {
      if (typeof window.unlockCourses === 'function') window.unlockCourses();
    } catch (_) {}

    try {
      if (typeof window.onAuthUserChanged === 'function') window.onAuthUserChanged(user);
    } catch (_) {}
  };

  window.SwordAuthSync = {
    onUser: (user) => {
      setSession(user);
      callHooks(user);
    }
  };

  onAuthStateChanged(auth, (user) => {
    window.SwordAuthSync.onUser(user);
  });
})();

