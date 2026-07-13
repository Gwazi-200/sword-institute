/**
 * ============================================================
 * Sword Institute LMS
 * Application Bootstrap
 * Version: 1.0.0
 * ============================================================
 */

import "./index.js";
import "./homeCourses.js";
import { applySettings } from './services/settingsService.js';
import { registerGlobalSearch } from './services/searchService.js';
import { handleError } from './services/errorService.js';
import './services/index.js';
import './components/SearchBar.js';

applySettings();
registerGlobalSearch();

window.addEventListener('error', (event) => {
    handleError(event.error || new Error('Unexpected runtime error'), 'runtime');
});

window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason || new Error('Unhandled promise rejection'), 'runtime');
});

console.log("🚀 Sword Institute LMS Started");

const currentPage = window.location.pathname.split("/").pop();

switch (currentPage) {

    case "index.html":
    case "":
        console.log("🏠 Homepage Loaded");
        break;

    case "dashboard.html":
        import("./dashboard.js");
        console.log("📊 Dashboard Loaded");
        break;

    case "lesson.html":
        import("./lessonPlayer.js");
        console.log("🎥 Lesson Player Loaded");
        break;

    default:
        console.log(`📄 ${currentPage}`);
}