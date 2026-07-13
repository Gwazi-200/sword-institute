import { getStoredTheme, getThemeMeta, toggleTheme } from '../services/themeService.js';

export function createThemeSwitcher(container) {
    if (!container) {
        return null;
    }

    const render = () => {
        const currentTheme = getStoredTheme();
        const meta = getThemeMeta(currentTheme);
        container.innerHTML = `
            <button type="button" class="sword-theme-switcher" aria-label="Switch theme">
                ${meta.label}
            </button>
        `;
    };

    container.addEventListener('click', () => {
        toggleTheme();
        render();
    });

    render();
    return { render };
}

export default createThemeSwitcher;
