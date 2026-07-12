const THEME_STORAGE_KEY = 'sword-theme';
const THEME_OPTIONS = ['pearlescent', 'violet', 'gold', 'midnight'];

function applyTheme(themeName = getStoredTheme()) {
    const safeTheme = normalizeTheme(themeName);
    const themeMap = {
        pearlescent: {
            '--primary': '#8B00FF',
            '--accent': '#FFD700',
            '--glass': 'rgba(255,255,255,0.46)',
            '--glass-border': 'rgba(255,255,255,0.76)',
            '--text-primary': '#1E1029',
            '--text-secondary': '#4B3A5C'
        },
        violet: {
            '--primary': '#8B00FF',
            '--accent': '#A855F7',
            '--glass': 'rgba(139, 0, 255, 0.18)',
            '--glass-border': 'rgba(255,255,255,0.34)',
            '--text-primary': '#f8f1ff',
            '--text-secondary': '#efe5ff'
        },
        gold: {
            '--primary': '#FFD700',
            '--accent': '#FFB800',
            '--glass': 'rgba(255, 215, 0, 0.18)',
            '--glass-border': 'rgba(255,255,255,0.34)',
            '--text-primary': '#3d2b00',
            '--text-secondary': '#6b4d00'
        },
        midnight: {
            '--primary': '#2d1b4e',
            '--accent': '#8B00FF',
            '--glass': 'rgba(24, 15, 43, 0.72)',
            '--glass-border': 'rgba(255,255,255,0.16)',
            '--text-primary': '#f5e9ff',
            '--text-secondary': '#d7c7ef'
        }
    };

    document.documentElement.setAttribute('data-theme', safeTheme);
    document.body?.setAttribute('data-theme', safeTheme);
    const rootStyle = document.documentElement.style;
    Object.entries(themeMap[safeTheme] || themeMap.pearlescent).forEach(([key, value]) => {
        rootStyle.setProperty(key, value);
    });
    localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
    return safeTheme;
}

function normalizeTheme(themeName) {
    return THEME_OPTIONS.includes(themeName) ? themeName : 'pearlescent';
}

function getStoredTheme() {
    try {
        return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
    } catch (error) {
        return 'pearlescent';
    }
}

function getThemeMeta(themeName = getStoredTheme()) {
    const normalized = normalizeTheme(themeName);
    const themeMap = {
        pearlescent: { label: 'Pearlescent White', accent: '#f5f2ff' },
        violet: { label: 'Royal Violet', accent: '#8B00FF' },
        gold: { label: 'Radiant Gold', accent: '#FFD700' },
        midnight: { label: 'Midnight Dark', accent: '#2d1b4e' }
    };

    return themeMap[normalized] || themeMap.pearlescent;
}

function toggleTheme() {
    const current = getStoredTheme();
    const next = current === 'pearlescent'
        ? 'violet'
        : current === 'violet'
            ? 'gold'
            : current === 'gold'
                ? 'midnight'
                : 'pearlescent';
    return applyTheme(next);
}

export { applyTheme, getStoredTheme, getThemeMeta, toggleTheme, THEME_STORAGE_KEY, THEME_OPTIONS };
export default { applyTheme, getStoredTheme, getThemeMeta, toggleTheme, THEME_STORAGE_KEY, THEME_OPTIONS };