import { applyTheme, getStoredTheme, getThemeMeta, toggleTheme, THEME_OPTIONS } from '../services/themeService.js';

export function createThemeManager(container) {
    if (!container) return null;

    const render = () => {
        const currentTheme = getStoredTheme();
        const themeMeta = getThemeMeta(currentTheme);
        container.innerHTML = `
            <div class="sword-theme-panel">
                <div class="sword-theme-panel__header">
                    <h3>Appearance</h3>
                    <span>${themeMeta.label}</span>
                </div>
                <div class="sword-theme-panel__options">
                    ${THEME_OPTIONS.map((theme) => {
                        const meta = getThemeMeta(theme);
                        const isActive = theme === currentTheme;
                        return `
                            <button class="sword-theme-option ${isActive ? 'is-active' : ''}" type="button" data-theme="${theme}">
                                <span class="sword-theme-swatch" style="background: linear-gradient(135deg, ${meta.accent}, var(--violet-deep, #8B00FF));"></span>
                                <span>${meta.label}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        attachEvents();
    };

    const attachEvents = () => {
        container.querySelectorAll('[data-theme]').forEach((button) => {
            button.addEventListener('click', () => {
                applyTheme(button.getAttribute('data-theme'));
                render();
            });
        });
    };

    render();
    return { render };
}

export default createThemeManager;
