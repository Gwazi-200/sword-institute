import { applyTheme, normalizeTheme } from './themeService.js';
import { read, write } from './storageService.js';

const SETTINGS_STORAGE_KEY = 'settings';

const DEFAULT_SETTINGS = {
    theme: 'pearlescent',
    language: 'en',
    accessibility: {
        highContrast: false,
        reducedMotion: false,
        screenReader: true,
    },
    notificationPreferences: {
        assignmentDue: true,
        courseCompleted: true,
        certificateEarned: true,
        weeklyReminder: true,
        systemAnnouncements: true,
    },
    learningPreferences: {
        focusMode: false,
        autoplay: false,
        recommendedPath: true,
    },
    privacy: {
        analytics: true,
        personalizedRecommendations: true,
    },
    aiPreferences: {
        tutorMode: 'balanced',
        voiceAssistant: false,
    },
    displayMode: 'default',
};

function normalizeSettings(settings = {}) {
    const sanitizedTheme = normalizeTheme(settings.theme);

    return {
        ...DEFAULT_SETTINGS,
        ...settings,
        theme: sanitizedTheme,
        accessibility: { ...DEFAULT_SETTINGS.accessibility, ...(settings.accessibility || {}) },
        notificationPreferences: { ...DEFAULT_SETTINGS.notificationPreferences, ...(settings.notificationPreferences || {}) },
        learningPreferences: { ...DEFAULT_SETTINGS.learningPreferences, ...(settings.learningPreferences || {}) },
        privacy: { ...DEFAULT_SETTINGS.privacy, ...(settings.privacy || {}) },
        aiPreferences: { ...DEFAULT_SETTINGS.aiPreferences, ...(settings.aiPreferences || {}) },
    };
}

function getSettings() {
    return normalizeSettings(read(SETTINGS_STORAGE_KEY, {}));
}

function updateSettings(patch = {}) {
    const nextSettings = normalizeSettings({ ...getSettings(), ...patch });
    write(SETTINGS_STORAGE_KEY, nextSettings);
    applySettings(nextSettings);
    return nextSettings;
}

function setSetting(path, value) {
    const currentSettings = getSettings();
    const nextSettings = { ...currentSettings };
    if (path.includes('.')) {
        const [parent, child] = path.split('.');
        nextSettings[parent] = { ...nextSettings[parent], [child]: value };
    } else {
        nextSettings[path] = value;
    }

    return updateSettings(nextSettings);
}

function applySettings(settings = getSettings()) {
    const normalized = normalizeSettings(settings);
    write(SETTINGS_STORAGE_KEY, normalized);
    applyTheme(normalized.theme);
    document.documentElement.dataset.settingsMode = normalized.displayMode;
    return normalized;
}

function resetSettings() {
    write(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
    applySettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
}

export { getSettings, updateSettings, setSetting, applySettings, resetSettings, DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY };
export default { getSettings, updateSettings, setSetting, applySettings, resetSettings, DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY };
