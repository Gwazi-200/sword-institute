import { subscribeToAuth, getCurrentUser, signOutUser, getDisplayName, getUserInitials } from '../services/authService.js';
import { applyTheme, getStoredTheme, getThemeMeta, toggleTheme } from '../services/themeService.js';
import { getNotifications, markAllRead } from '../services/notificationService.js';
import { getUserProfileView } from './userProfile.js';
import { showToast } from '../ui.js';

const NAV_ITEMS = [
    { label: 'Home', href: 'index.html', page: 'home' },
    { label: 'Courses', href: 'courses.html', page: 'courses' },
    { label: 'Knowledge Hub', href: 'knowledge-hub.html', page: 'knowledge-hub' },
    { label: 'Dashboard', href: 'dashboard.html', page: 'dashboard' },
    { label: 'Professor SWORD', href: 'ai-message.html', page: 'ai' },
];

function getCurrentPageKey() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    if (path.includes('courses')) return 'courses';
    if (path.includes('knowledge')) return 'knowledge-hub';
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('ai-message')) return 'ai';
    return 'home';
}

export async function createNavbar(container, options = {}) {
    if (!container) return null;

    let eventHandlersBound = false;

    const state = {
        user: null,
        profile: null,
        theme: getStoredTheme(),
        notifications: [],
        openMenu: null,
    };

    const render = async () => {
        state.user = getCurrentUser();
        state.profile = state.user ? await getUserProfileView(state.user) : null;
        state.notifications = getNotifications();
        const unreadCount = state.notifications.filter((item) => item.unread).length;
        const activePage = options.activePage || getCurrentPageKey();
        const themeMeta = getThemeMeta(state.theme);

        container.innerHTML = `
            <nav class="sword-main-nav" aria-label="Primary navigation">
                <div class="sword-nav-shell">
                    <a href="index.html" class="sword-nav-logo" aria-label="Sword Institute home">
                        <i class="fas fa-shield-halved" aria-hidden="true"></i>
                        <span>Sword Institute</span>
                    </a>

                    <button class="sword-nav-toggle" type="button" aria-label="Toggle menu" aria-expanded="false" data-action="toggle-mobile">
                        <span></span><span></span><span></span>
                    </button>

                    <div class="sword-nav-center" data-nav-links>
                        <ul class="sword-nav-links">
                            ${NAV_ITEMS.map((item) => `
                                <li>
                                    <a href="${item.href}" class="${activePage === item.page ? 'active' : ''}" data-nav-link="${item.page}">
                                        ${item.label}
                                    </a>
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <div class="sword-nav-actions">
                        ${state.user ? `
                            <button class="sword-nav-icon" type="button" aria-label="Notifications" data-action="toggle-notifications">
                                <i class="fas fa-bell" aria-hidden="true"></i>
                                ${unreadCount ? `<span class="sword-nav-badge">${unreadCount}</span>` : ''}
                            </button>
                            <div class="sword-profile-wrap">
                                <button class="sword-profile-trigger" type="button" aria-haspopup="menu" aria-expanded="false" data-action="toggle-profile">
                                    ${state.profile?.photoURL ? `<img class="sword-profile-avatar" src="${state.profile.photoURL}" alt="${state.profile.displayName}" />` : `<span class="sword-profile-avatar" aria-hidden="true">${state.profile?.initials || getUserInitials(state.user)}</span>`}
                                </button>
                                <div class="sword-profile-menu" role="menu" aria-label="Profile menu">
                                    <div class="sword-profile-card">
                                        <div class="sword-profile-card__avatar">${state.profile?.photoURL ? `<img class="sword-profile-avatar" src="${state.profile.photoURL}" alt="${state.profile.displayName}" />` : state.profile?.initials || getUserInitials(state.user)}</div>
                                        <div>
                                            <div class="sword-profile-card__name">${state.profile?.displayName || getDisplayName(state.user)}</div>
                                            <div class="sword-profile-card__meta">${state.profile?.role || 'Student'} • Online</div>
                                        </div>
                                    </div>
                                    <a href="dashboard.html" role="menuitem">Dashboard</a>
                                    <a href="courses.html" role="menuitem">My Courses</a>
                                    <a href="knowledge-hub.html" role="menuitem">Knowledge Hub</a>
                                    <a href="settings.html" role="menuitem">Settings</a>
                                    <button type="button" data-action="logout" role="menuitem">Logout</button>
                                </div>
                            </div>
                        ` : `
                            <a href="login.html" class="sword-nav-link-btn sword-nav-link-btn--ghost">Login</a>
                            <a href="register.html" class="sword-nav-link-btn sword-nav-link-btn--solid">Register</a>
                        `}
                    </div>
                </div>
                <div class="sword-mobile-drawer" data-mobile-drawer>
                    <ul class="sword-nav-links sword-nav-links--mobile">
                        ${NAV_ITEMS.map((item) => `
                            <li>
                                <a href="${item.href}" class="${activePage === item.page ? 'active' : ''}">
                                    ${item.label}
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                    ${state.user ? `
                        <div class="sword-mobile-actions">
                            <a href="settings.html">Settings</a>
                            <button type="button" data-action="logout">Logout</button>
                        </div>
                    ` : ''}
                </div>
                <div class="sword-notifications" data-notifications-panel>
                    <div class="sword-notifications__header">
                        <h3>Recent Notifications</h3>
                        <button type="button" data-action="mark-read">Mark all read</button>
                    </div>
                    <div class="sword-notifications__list">
                        ${state.notifications.map((item) => `
                            <div class="sword-notification-item ${item.unread ? 'is-unread' : ''}">
                                <strong>${item.title}</strong>
                                <p>${item.message}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </nav>
        `;

        attachEvents();
        applyTheme(state.theme);
        container.querySelector('[data-nav-links]')?.classList.remove('is-open');
        container.querySelector('[data-mobile-drawer]')?.classList.remove('is-open');
        container.querySelector('[data-notifications-panel]')?.classList.remove('is-open');
    };

    const setMenuState = (menuName, isOpen) => {
        state.openMenu = isOpen ? menuName : null;
        const toggle = container.querySelector('[data-action="toggle-mobile"]');
        const mobileDrawer = container.querySelector('[data-mobile-drawer]');
        const notificationsPanel = container.querySelector('[data-notifications-panel]');
        const profileMenu = container.querySelector('.sword-profile-menu');
        const profileTrigger = container.querySelector('.sword-profile-trigger');

        toggle?.setAttribute('aria-expanded', String(isOpen && menuName === 'mobile'));
        mobileDrawer?.classList.toggle('is-open', menuName === 'mobile' && isOpen);
        notificationsPanel?.classList.toggle('is-open', menuName === 'notifications' && isOpen);
        profileMenu?.classList.toggle('is-open', menuName === 'profile' && isOpen);
        profileTrigger?.setAttribute('aria-expanded', String(menuName === 'profile' && isOpen));
    };

    const attachEvents = () => {
        if (eventHandlersBound) return;

        const mobileToggle = container.querySelector('[data-action="toggle-mobile"]');
        const notificationsToggle = container.querySelector('[data-action="toggle-notifications"]');
        const profileToggle = container.querySelector('.sword-profile-trigger');
        const logoutButtons = container.querySelectorAll('[data-action="logout"]');
        const markReadButton = container.querySelector('[data-action="mark-read"]');

        const handleContainerClick = (event) => {
            if (!container.contains(event.target)) {
                return;
            }

            const action = event.target.closest('[data-action]')?.getAttribute('data-action');
            if (!action) {
                if (!event.target.closest('.sword-profile-menu') && !event.target.closest('.sword-notifications') && !event.target.closest('.sword-nav-icon') && !event.target.closest('.sword-profile-trigger') && !event.target.closest('.sword-nav-toggle')) {
                    setMenuState(null, false);
                }
            }
        };

        const handleDocumentKeydown = (event) => {
            if (event.key === 'Escape') {
                setMenuState(null, false);
            }
        };

        mobileToggle?.addEventListener('click', () => {
            const nextState = state.openMenu === 'mobile' ? false : 'mobile';
            setMenuState(nextState, Boolean(nextState));
        });

        notificationsToggle?.addEventListener('click', () => {
            const nextState = state.openMenu === 'notifications' ? false : 'notifications';
            setMenuState(nextState, Boolean(nextState));
        });

        profileToggle?.addEventListener('click', () => {
            const nextState = state.openMenu === 'profile' ? false : 'profile';
            setMenuState(nextState, Boolean(nextState));
        });

        logoutButtons.forEach((button) => {
            button.addEventListener('click', async () => {
                await signOutUser();
                setMenuState(null, false);
                await render();
                showToast('You have been logged out. Redirecting home.', 'success');
                window.location.href = 'index.html';
            });
        });

        markReadButton?.addEventListener('click', () => {
            markAllRead();
            render();
        });

        container.addEventListener('click', handleContainerClick);
        document.addEventListener('keydown', handleDocumentKeydown);
        eventHandlersBound = true;
    };

    subscribeToAuth((user) => {
        state.user = user;
        render();
    });

    await render();

    return {
        render,
        refresh: render,
    };
}

export { NAV_ITEMS };
export default createNavbar;
