import { createSearchBar } from './SearchBar.js';
import { createNotificationCenter } from './NotificationCenter.js';
import { createThemeSwitcher } from './ThemeSwitcher.js';

export function createAppHeader(container) {
    if (!container) {
        return null;
    }

    container.innerHTML = `
        <header class="sword-app-header">
            <div class="sword-app-header__brand">Sword Institute</div>
            <div class="sword-app-header__toolbar">
                <div data-search-root></div>
                <div data-notifications-root></div>
                <div data-theme-root></div>
            </div>
        </header>
    `;

    createSearchBar(container.querySelector('[data-search-root]'));
    createNotificationCenter(container.querySelector('[data-notifications-root]'));
    createThemeSwitcher(container.querySelector('[data-theme-root]'));

    return { container };
}

export default createAppHeader;
