const THEME_STORAGE_KEY = 'sword-theme';
const THEME_OPTIONS = ['pearlescent', 'violet', 'gold', 'midnight', 'ocean', 'forest'];

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
        },
        ocean: {
            '--primary': '#0F766E',
            '--accent': '#38BDF8',
            '--glass': 'rgba(15, 118, 110, 0.18)',
            '--glass-border': 'rgba(255,255,255,0.24)',
            '--text-primary': '#082f49',
            '--text-secondary': '#0f172a'
        },
        forest: {
            '--primary': '#166534',
            '--accent': '#4ADE80',
            '--glass': 'rgba(22, 101, 52, 0.16)',
            '--glass-border': 'rgba(255,255,255,0.28)',
            '--text-primary': '#052e16',
            '--text-secondary': '#14532d'
        }
    };

    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', safeTheme);
        document.body?.setAttribute('data-theme', safeTheme);
        const rootStyle = document.documentElement.style;
        Object.entries(themeMap[safeTheme] || themeMap.pearlescent).forEach(([key, value]) => {
            rootStyle.setProperty(key, value);
        });
    }

    try {
        localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
    } catch (error) {
        console.warn('Theme storage unavailable', error);
    }
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
        midnight: { label: 'Midnight Dark', accent: '#2d1b4e' },
        ocean: { label: 'Ocean Blue', accent: '#0F766E' },
        forest: { label: 'Forest Emerald', accent: '#166534' }
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
                : current === 'midnight'
                    ? 'ocean'
                    : current === 'ocean'
                        ? 'forest'
                        : 'pearlescent';
    return applyTheme(next);
}

export { applyTheme, getStoredTheme, getThemeMeta, toggleTheme, THEME_STORAGE_KEY, THEME_OPTIONS };
export default { applyTheme, getStoredTheme, getThemeMeta, toggleTheme, THEME_STORAGE_KEY, THEME_OPTIONS };