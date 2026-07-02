/**
 * ============================================================
 * Sword Institute LMS
 * Application Bootstrap
 * Version: 1.0.0
 * ============================================================
 */

import "./index.js";
import "./homeCourses.js";

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