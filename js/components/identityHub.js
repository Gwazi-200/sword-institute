import { subscribeToAuth, getCurrentUser, getDisplayName, getUserInitials, signOutUser } from '../services/authService.js';
import { applyTheme, getStoredTheme, getThemeMeta, toggleTheme } from '../services/themeService.js';
import { getNotifications, markAllRead } from '../services/notificationService.js';

function createIdentityHub(container, options = {}) {
    if (!container) return null;

    const state = {
        user: null,
        theme: getStoredTheme()
    };

    const closeMenu = () => {
        container.querySelector('.identity-menu')?.classList.remove('is-open');
        const trigger = container.querySelector('.identity-hub-trigger');
        trigger?.setAttribute('aria-expanded', 'false');
    };

    const render = () => {
        const user = state.user || getCurrentUser();
        const themeMeta = getThemeMeta(state.theme);
        const notifications = getNotifications();
        const unreadCount = notifications.filter((item) => item.unread).length;

        container.innerHTML = `
            <div class="identity-hub glass-card" role="region" aria-label="Identity hub">
                ${user ? `
                    <div class="identity-hub-user">
                        <button class="identity-hub-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Open profile menu">
                            <span class="identity-avatar" aria-hidden="true">${getUserInitials(user)}</span>
                        </button>
                        <div class="identity-menu" role="menu" aria-label="User menu">
                            <a href="dashboard.html" role="menuitem">📊 Dashboard</a>
                            <a href="courses.html" role="menuitem">🎓 My Courses</a>
                            <a href="settings.html" role="menuitem">⚙ Settings</a>
                            <button class="logout-btn" type="button" data-action="logout">🚪 Logout</button>
                        </div>
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
        const logoutButton = container.querySelector('[data-action="logout"]');

        if (trigger) {
            trigger.addEventListener('click', () => {
                const menu = container.querySelector('.identity-menu');
                const isOpen = menu?.classList.toggle('is-open');
                trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                await signOutUser();
                closeMenu();
                render();
            });
        }

        document.addEventListener('click', (event) => {
            if (!container.contains(event.target)) {
                closeMenu();
            }
        });
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