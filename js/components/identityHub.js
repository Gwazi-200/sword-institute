import { subscribeToAuth, getCurrentUser, getDisplayName, getUserInitials, signOutUser } from '../services/authService.js';
import { applyTheme, getStoredTheme, getThemeMeta, toggleTheme } from '../services/themeService.js';
import { getNotifications, markAllRead } from '../services/notificationService.js';

function createIdentityHub(container, options = {}) {
    if (!container) return null;

    const state = {
        user: null,
        theme: getStoredTheme()
    };

    const render = () => {
        const user = state.user || getCurrentUser();
        const themeMeta = getThemeMeta(state.theme);
        const notifications = getNotifications();
        const unreadCount = notifications.filter((item) => item.unread).length;

        container.innerHTML = `
            <div class="identity-hub glass-card" role="region" aria-label="Identity hub">
                ${user ? `
                    <button class="identity-hub-trigger" type="button" aria-haspopup="menu" aria-expanded="false">
                        <span class="identity-avatar" aria-hidden="true">${getUserInitials(user)}</span>
                        <span class="identity-copy">
                            <span class="identity-greeting">${getGreeting()}</span>
                            <span class="identity-name">${getDisplayName(user)}</span>
                        </span>
                        <span class="identity-status" aria-label="Online status">● Online</span>
                    </button>
                    <div class="identity-menu" role="menu" aria-label="User menu">
                        <a href="profile.html" role="menuitem">👤 My Profile</a>
                        <a href="courses.html" role="menuitem">🎓 My Courses</a>
                        <a href="dashboard.html" role="menuitem">📊 Dashboard</a>
                        <a href="settings.html" role="menuitem">⚙ Settings</a>
                        <button class="theme-toggle-btn" type="button" data-action="theme">🎨 ${themeMeta.label}</button>
                        <button class="notification-toggle-btn" type="button" data-action="notifications">🔔 ${unreadCount} unread</button>
                        <button class="logout-btn" type="button" data-action="logout">🚪 Logout</button>
                    </div>
                ` : `
                    <div class="identity-hub-auth">
                        <a href="login.html" class="btn btn-outline-violet">Login</a>
                        <a href="register.html" class="btn btn-primary">Register</a>
                    </div>
                `}
            </div>
        `;

        attachEvents();
    };

    const attachEvents = () => {
        const trigger = container.querySelector('.identity-hub-trigger');
        const themeButton = container.querySelector('[data-action="theme"]');
        const notificationsButton = container.querySelector('[data-action="notifications"]');
        const logoutButton = container.querySelector('[data-action="logout"]');

        if (trigger) {
            trigger.addEventListener('click', () => {
                container.querySelector('.identity-menu')?.classList.toggle('is-open');
                trigger.setAttribute('aria-expanded', container.querySelector('.identity-menu')?.classList.contains('is-open') ? 'true' : 'false');
            });
        }

        if (themeButton) {
            themeButton.addEventListener('click', () => {
                state.theme = toggleTheme();
                render();
            });
        }

        if (notificationsButton) {
            notificationsButton.addEventListener('click', async () => {
                markAllRead();
                render();
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                await signOutUser();
                render();
            });
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    subscribeToAuth((user) => {
        state.user = user;
        render();
    });

    applyTheme(getStoredTheme());
    render();

    return {
        render,
        refresh: render
    };
}

export { createIdentityHub };
export default createIdentityHub;