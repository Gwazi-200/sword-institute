(function () {
    const STORAGE_KEYS = {
        users: 'sword_users',
        session: 'sword_session',
        guest: 'sword_guest_mode'
    };

    const INACTIVITY_LIMIT = 30 * 60 * 1000;
    let inactivityWatcher = null;

    function safeParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch (_error) {
            return fallback;
        }
    }

    function getUsers() {
        return safeParse(localStorage.getItem(STORAGE_KEYS.users), []);
    }

    function getSession() {
        return safeParse(localStorage.getItem(STORAGE_KEYS.session), null);
    }

    function clearSession() {
        localStorage.removeItem(STORAGE_KEYS.session);
    }

    function getState() {
        const session = getSession();
        const isGuest = localStorage.getItem(STORAGE_KEYS.guest) === 'true';

        if (!session) {
            return {
                isAuthenticated: false,
                isGuest,
                user: null,
                reason: 'no-session'
            };
        }

        const now = Date.now();
        const expiredByTime = now > session.expiresAt;
        const expiredByIdle = now - session.lastActivityAt > INACTIVITY_LIMIT;

        if (expiredByTime || expiredByIdle) {
            clearSession();
            return {
                isAuthenticated: false,
                isGuest,
                user: null,
                reason: expiredByIdle ? 'inactive' : 'expired'
            };
        }

        const user = getUsers().find((entry) => entry.id === session.userId) || null;

        if (!user) {
            clearSession();
            return {
                isAuthenticated: false,
                isGuest,
                user: null,
                reason: 'user-not-found'
            };
        }

        return {
            isAuthenticated: true,
            isGuest: false,
            user,
            reason: 'ok'
        };
    }

    function touchActivity() {
        const session = getSession();
        if (!session) return;

        session.lastActivityAt = Date.now();
        localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    }

    function watchActivity() {
        ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach((eventName) => {
            document.addEventListener(eventName, touchActivity, { passive: true });
        });

        if (inactivityWatcher) {
            clearInterval(inactivityWatcher);
        }

        inactivityWatcher = setInterval(() => {
            const state = getState();
            if (state.isAuthenticated) return;
            if (state.reason === 'inactive' || state.reason === 'expired') {
                window.location.href = 'courses.html';
            }
        }, 60 * 1000);
    }

    function enforce(options) {
        const settings = Object.assign({
            allowGuest: false,
            redirectTo: 'courses.html',
            onAuthenticated: null,
            onGuest: null,
            onBlocked: null,
            watch: true
        }, options || {});

        const state = getState();

        if (state.isAuthenticated) {
            if (typeof settings.onAuthenticated === 'function') {
                settings.onAuthenticated(state);
            }
            if (settings.watch) {
                watchActivity();
            }
            return state;
        }

        if (settings.allowGuest && state.isGuest) {
            if (typeof settings.onGuest === 'function') {
                settings.onGuest(state);
            }
            return state;
        }

        if (typeof settings.onBlocked === 'function') {
            settings.onBlocked(state);
            return state;
        }

        window.location.href = settings.redirectTo;
        return state;
    }

    function requireAuthenticatedAction(handler, options) {
        const settings = Object.assign({
            fallback: null,
            message: 'Please login to continue.'
        }, options || {});

        return function wrappedHandler() {
            const state = getState();
            if (!state.isAuthenticated) {
                if (typeof settings.fallback === 'function') {
                    settings.fallback(state);
                } else {
                    window.alert(settings.message);
                }
                return;
            }
            return handler.apply(this, arguments);
        };
    }

    window.SwordLocalAuth = {
        getState,
        enforce,
        watchActivity,
        requireAuthenticatedAction,
        constants: {
            STORAGE_KEYS,
            INACTIVITY_LIMIT
        }
    };
})();
