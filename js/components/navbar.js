import { subscribeToAuth, getCurrentUser, signOutUser, getDisplayName, getUserInitials } from '../services/authService.js';
import { applyTheme, getStoredTheme, getThemeMeta, toggleTheme } from '../services/themeService.js';
import { getNotifications, markAllRead } from '../services/notificationService.js';
import { getUserProfileView } from './userProfile.js';
import { buildProfileCenterData, buildProfileUpdatePayload } from '../utils/profileCenterUtils.js';
import { getProfileCenterRecord, updateProfileCenter, uploadProfilePhoto, removeProfilePhoto } from '../services/profileCenterService.js';
import { loadProfileState, mergeProfileState, saveProfileState } from '../utils/profilePageState.js';
import { showToast } from '../ui.js';

const NAV_ITEMS = [
    { label: 'Home', href: 'index.html', page: 'home' },
    { label: 'Courses', href: 'courses.html', page: 'courses' },
    { label: 'Knowledge Hub', href: 'knowledge-hub.html', page: 'knowledge-hub' },
    { label: 'Dashboard', href: 'dashboard.html', page: 'dashboard' },
    { label: 'Professor SWORD', href: 'ai-message.html', page: 'ai' },
];

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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

    const state = {
        user: null,
        profile: null,
        theme: getStoredTheme(),
        notifications: [],
        openMenu: null,
        profileModal: {
            isOpen: false,
            previewUrl: '',
            file: null,
        },
    };

    const render = async () => {
        state.user = getCurrentUser();
        state.notifications = getNotifications();
        const localProfile = loadProfileState();
        const profileView = state.user ? await getUserProfileView(state.user) : null;
        const profileRecord = state.user ? await getProfileCenterRecord(state.user.uid) : null;
        state.profile = state.user ? mergeProfileState(localProfile, { ...(profileView || {}), ...(profileRecord || {}) }) : null;
        const unreadCount = state.notifications.filter((item) => item.unread).length;
        const activePage = options.activePage || getCurrentPageKey();
        const themeMeta = getThemeMeta(state.theme);
        const profileCenter = state.profile ? buildProfileCenterData(state.profile, state.user) : null;
        const profileModalPreview = state.profileModal.previewUrl || profileCenter?.photoURL || '';

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
                                    ${profileCenter?.photoURL ? `<img class="sword-profile-avatar" src="${profileCenter.photoURL}" alt="${profileCenter.displayName}" />` : `<span class="sword-profile-avatar" aria-hidden="true">${profileCenter?.initials || getUserInitials(state.user)}</span>`}
                                </button>
                                <div class="sword-profile-menu" role="menu" aria-label="Profile menu">
                                    <div class="sword-profile-card">
                                        <div class="sword-profile-card__avatar">${profileCenter?.photoURL ? `<img class="sword-profile-avatar" src="${profileCenter.photoURL}" alt="${profileCenter.displayName}" />` : `<span class="sword-profile-avatar__fallback">${profileCenter?.initials || getUserInitials(state.user)}</span>`}</div>
                                        <div>
                                            <div class="sword-profile-card__name">${profileCenter?.displayName || getDisplayName(state.user)}</div>
                                            <div class="sword-profile-card__meta">${profileCenter?.role || 'Student'} • Online</div>
                                        </div>
                                    </div>
                                    <div class="sword-profile-stats" role="group" aria-label="Profile stats">
                                        <div><strong>${profileCenter?.streak || 0}</strong><span>Streak</span></div>
                                        <div><strong>${profileCenter?.xp || 0}</strong><span>XP</span></div>
                                        <div><strong>${profileCenter?.completionPercentage || 0}%</strong><span>Complete</span></div>
                                    </div>
                                    <div class="sword-profile-actions">
                                        <a href="dashboard.html" role="menuitem">📚 My Learning</a>
                                        <a href="profile.html" role="menuitem">👤 My Profile</a>
                                        <a href="dashboard.html" role="menuitem">📈 Progress</a>
                                        <a href="dashboard.html" role="menuitem">🏆 Achievements</a>
                                        <a href="dashboard.html" role="menuitem">🎓 Certificates</a>
                                        <a href="knowledge-hub.html" role="menuitem">📖 Knowledge Hub</a>
                                        <a href="ai-message.html" role="menuitem">🤖 Professor SWORD</a>
                                        <a href="settings.html" role="menuitem">🎨 Appearance</a>
                                        <a href="settings.html" role="menuitem">🔔 Notifications</a>
                                        <button type="button" class="sword-profile-inline-action" data-action="manage-profile" role="menuitem">⚙ Account Settings</button>
                                        <a href="help.html" role="menuitem">❓ Help Centre</a>
                                    </div>
                                    <button type="button" data-action="logout" role="menuitem">🚪 Logout</button>
                                </div>
                                <div class="sword-profile-editor ${state.profileModal.isOpen ? 'is-open' : ''}" data-profile-editor role="dialog" aria-modal="true" aria-labelledby="profile-editor-title" ${state.profileModal.isOpen ? '' : 'hidden'}>
                                    <div class="sword-profile-editor__panel">
                                        <div class="sword-profile-editor__header">
                                            <div>
                                                <h3 id="profile-editor-title">Profile center</h3>
                                                <p>Update your photo and account details</p>
                                            </div>
                                            <button type="button" class="sword-profile-editor__close" data-action="close-profile-editor" aria-label="Close profile editor">✕</button>
                                        </div>
                                        <div class="sword-profile-editor__body">
                                            <div class="sword-profile-editor__photo">
                                                <div class="sword-profile-editor__avatar">
                                                    ${profileModalPreview ? `<img src="${profileModalPreview}" alt="${escapeHtml(profileCenter?.displayName || 'Profile preview')}" />` : `<span>${profileCenter?.initials || getUserInitials(state.user)}</span>`}
                                                </div>
                                                <label class="sword-profile-editor__upload">
                                                    <input type="file" accept="image/*" data-action="select-profile-photo" hidden />
                                                    <span>${profileCenter?.photoURL || state.profileModal.previewUrl ? 'Change photo' : 'Upload photo'}</span>
                                                </label>
                                                ${(profileCenter?.photoURL || state.profileModal.previewUrl) ? `<button type="button" class="sword-profile-editor__remove" data-action="remove-profile-photo">Remove photo</button>` : ''}
                                                <p class="sword-profile-editor__hint">Preview your image in a circular crop before saving.</p>
                                            </div>
                                            <div class="sword-profile-editor__fields">
                                                <label>Full name<input type="text" name="profileName" value="${escapeHtml(profileCenter?.displayName || '')}" /></label>
                                                <label>Phone<input type="text" name="profilePhone" value="${escapeHtml(state.profile?.phone || '')}" /></label>
                                                <label>Country<input type="text" name="profileCountry" value="${escapeHtml(state.profile?.country || '')}" /></label>
                                                <label>Profession<input type="text" name="profileProfession" value="${escapeHtml(state.profile?.profession || '')}" /></label>
                                                <label>Organization<input type="text" name="profileOrganization" value="${escapeHtml(state.profile?.organization || '')}" /></label>
                                                <label>Bio<textarea name="profileBio">${escapeHtml(state.profile?.bio || '')}</textarea></label>
                                            </div>
                                        </div>
                                        <div class="sword-profile-editor__actions">
                                            <button type="button" data-action="close-profile-editor">Cancel</button>
                                            <button type="button" data-action="save-profile-editor">Save changes</button>
                                        </div>
                                    </div>
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
        const mobileToggle = container.querySelector('[data-action="toggle-mobile"]');
        const notificationsToggle = container.querySelector('[data-action="toggle-notifications"]');
        const profileToggle = container.querySelector('.sword-profile-trigger');
        const logoutButtons = container.querySelectorAll('[data-action="logout"]');
        const manageProfileButton = container.querySelector('[data-action="manage-profile"]');
        const markReadButton = container.querySelector('[data-action="mark-read"]');
        const closeProfileEditorButtons = container.querySelectorAll('[data-action="close-profile-editor"]');
        const saveProfileEditorButton = container.querySelector('[data-action="save-profile-editor"]');
        const removeProfilePhotoButton = container.querySelector('[data-action="remove-profile-photo"]');
        const selectProfilePhotoInput = container.querySelector('[data-action="select-profile-photo"]');

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
                state.profileModal.isOpen = false;
                state.profileModal.file = null;
                state.profileModal.previewUrl = '';
                setMenuState(null, false);
                render();
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

        manageProfileButton?.addEventListener('click', async () => {
            setMenuState(null, false);
            if (!state.user) return;
            state.profileModal.isOpen = true;
            state.profileModal.previewUrl = '';
            state.profileModal.file = null;
            await render();
        });

        closeProfileEditorButtons.forEach((button) => {
            button.addEventListener('click', async () => {
                state.profileModal.isOpen = false;
                state.profileModal.file = null;
                state.profileModal.previewUrl = '';
                await render();
            });
        });

        selectProfilePhotoInput?.addEventListener('change', async (event) => {
            const [file] = event.target.files || [];
            if (!file) return;

            if (state.profileModal.previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(state.profileModal.previewUrl);
            }

            state.profileModal.file = file;
            state.profileModal.previewUrl = URL.createObjectURL(file);
            await render();
        });

        removeProfilePhotoButton?.addEventListener('click', async () => {
            if (!state.user) return;
            state.profileModal.previewUrl = '';
            state.profileModal.file = null;
            await removeProfilePhoto(state.user.uid);
            await render();
            showToast('Profile photo removed.', 'success');
        });

        saveProfileEditorButton?.addEventListener('click', async () => {
            if (!state.user) return;

            const nameInput = container.querySelector('input[name="profileName"]');
            const phoneInput = container.querySelector('input[name="profilePhone"]');
            const countryInput = container.querySelector('input[name="profileCountry"]');
            const professionInput = container.querySelector('input[name="profileProfession"]');
            const organizationInput = container.querySelector('input[name="profileOrganization"]');
            const bioInput = container.querySelector('textarea[name="profileBio"]');

            const nextProfile = buildProfileUpdatePayload({
                fullName: nameInput?.value || '',
                phone: phoneInput?.value || '',
                country: countryInput?.value || '',
                profession: professionInput?.value || '',
                organization: organizationInput?.value || '',
                bio: bioInput?.value || '',
                photoURL: state.profileModal.previewUrl || '',
            });

            try {
                saveProfileEditorButton.disabled = true;
                saveProfileEditorButton.textContent = 'Saving...';

                if (state.profileModal.file) {
                    await uploadProfilePhoto(state.user.uid, state.profileModal.file);
                }

                await updateProfileCenter(state.user.uid, nextProfile);
                saveProfileState(mergeProfileState(loadProfileState(), {
                    ...nextProfile,
                    fullName: nameInput?.value || '',
                    email: state.user.email || '',
                }));
                state.profileModal.isOpen = false;
                state.profileModal.file = null;
                state.profileModal.previewUrl = '';
                await render();
                showToast('Profile updated successfully.', 'success');
            } catch (error) {
                console.error('Failed to save profile', error);
                showToast('We could not save your profile. Please try again.', 'error');
            } finally {
                saveProfileEditorButton.disabled = false;
                saveProfileEditorButton.textContent = 'Save changes';
            }
        });

        markReadButton?.addEventListener('click', () => {
            markAllRead();
            render();
        });

        container.removeEventListener('click', handleContainerClick);
        document.removeEventListener('keydown', handleDocumentKeydown);
        container.addEventListener('click', handleContainerClick);
        document.addEventListener('keydown', handleDocumentKeydown);
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
