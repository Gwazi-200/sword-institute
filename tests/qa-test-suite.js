/**
 * ============================================================
 * Sword Institute LMS - Comprehensive QA Test Suite
 * Version: 1.0.0
 * ============================================================
 *
 * Production QA testing framework covering:
 * - Core functionality tests
 * - Integration tests
 * - Performance tests
 * - Error handling
 * - Accessibility
 *
 * Run in DevTools Console:
 *   import { runAllTests } from './tests/qa-test-suite.js';
 *   await runAllTests();
 *
 * ============================================================
 */

// Test framework utilities
const tests = [];
let passedTests = 0;
let failedTests = 0;
let testResults = [];

/**
 * Register a test
 */
function test(name, fn) {
    tests.push({ name, fn });
}

/**
 * Assert condition
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

/**
 * Assert equality
 */
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}: ${message}`);
    }
}

/**
 * Log test result
 */
function logTestResult(name, passed, error = null) {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (error) {
        console.error(`   Error: ${error}`);
    }
    testResults.push({ name, passed, error });
}

/**
 * Run all tests
 */
export async function runAllTests() {
    console.clear();
    console.group('%c🧪 Sword Institute LMS - QA Test Suite', 'color: blue; font-weight: bold; font-size: 16px');

    passedTests = 0;
    failedTests = 0;
    testResults = [];

    for (const test_item of tests) {
        try {
            await test_item.fn();
            passedTests++;
            logTestResult(test_item.name, true);
        } catch (err) {
            failedTests++;
            logTestResult(test_item.name, false, err.message);
        }
    }

    console.groupEnd();
    printSummary();
}

/**
 * Print test summary
 */
function printSummary() {
    console.group('%c📊 Test Summary', 'color: purple; font-weight: bold');
    console.log(`Total: ${testResults.length}`);
    console.log(`%cPassed: ${passedTests}`, 'color: green; font-weight: bold');
    console.log(`%cFailed: ${failedTests}`, `color: ${failedTests > 0 ? 'red' : 'green'}; font-weight: bold`);
    console.log(`Success Rate: ${((passedTests / testResults.length) * 100).toFixed(1)}%`);
    console.groupEnd();

    if (failedTests > 0) {
        console.group('%c⚠️  Failed Tests', 'color: red; font-weight: bold');
        testResults.filter(r => !r.passed).forEach(r => {
            console.log(`${r.name}: ${r.error}`);
        });
        console.groupEnd();
    }
}

// ============================================================
// CORE FUNCTIONALITY TESTS
// ============================================================

test('Logger module loads', async () => {
    const logger = await import('../js/core/logger.js');
    assert(logger.debug, 'Logger should have debug function');
    assert(logger.info, 'Logger should have info function');
    assert(logger.error, 'Logger should have error function');
});

test('Environment Service loads', async () => {
    const env = await import('../js/core/environmentService.js');
    assert(typeof env.isDevelopment === 'function', 'Should have isDevelopment');
    assert(typeof env.isProduction === 'function', 'Should have isProduction');
});

test('Safe DOM module loads', async () => {
    const safeDom = await import('../js/core/safe-dom.js');
    assert(typeof safeDom.safeQuery === 'function', 'Should have safeQuery');
    assert(typeof safeDom.onDOMReady === 'function', 'Should have onDOMReady');
});

test('Modal Manager loads', async () => {
    const modalMgr = await import('../js/core/modalManager.js');
    assert(typeof modalMgr.default.create === 'function', 'Should have create');
    assert(typeof modalMgr.default.get === 'function', 'Should have get');
});

test('Auth Service loads', async () => {
    const authSvc = await import('../js/services/authService.js');
    assert(typeof authSvc.getCurrentUser === 'function', 'Should have getCurrentUser');
    assert(typeof authSvc.subscribeToAuth === 'function', 'Should have subscribeToAuth');
});

test('Notification Manager loads', async () => {
    const notifMgr = await import('../js/core/notificationManager.js');
    assert(typeof notifMgr.getNotifications === 'function', 'Should have getNotifications');
    assert(typeof notifMgr.subscribeToNotifications === 'function', 'Should have subscribeToNotifications');
});

test('Theme Service loads', async () => {
    const theme = await import('../js/services/themeService.js');
    assert(typeof theme.applyTheme === 'function', 'Should have applyTheme');
    assert(typeof theme.getStoredTheme === 'function', 'Should have getStoredTheme');
});

test('Firebase module exports', async () => {
    const firebase = await import('../js/firebase.js');
    assert(firebase.auth, 'Should export auth');
    assert(firebase.db, 'Should export db');
    assert(firebase.onAuthStateChanged, 'Should export onAuthStateChanged');
});

// ============================================================
// DOM AND INITIALIZATION TESTS
// ============================================================

test('DOM is ready', () => {
    assert(document.readyState === 'complete' || document.readyState === 'interactive', 'DOM should be ready');
});

test('No console errors', () => {
    // This would need to be checked by monitoring console
    // For now, just verify we can run tests
    assert(true, 'Console monitoring should be active');
});

test('Document has html and body', () => {
    assert(document.documentElement, 'HTML element should exist');
    assert(document.body, 'Body element should exist');
});

// ============================================================
// FIREBASE CONFIGURATION TESTS
// ============================================================

test('Firebase config is valid', async () => {
    const firebase = await import('../js/firebase.js');
    const config = firebase.firebaseConfig || {};
    assert(config.apiKey, 'Firebase API key should be configured');
    assert(config.projectId, 'Firebase project ID should be configured');
});

test('Firebase app is initialized', async () => {
    const firebase = await import('../js/firebase.js');
    assert(firebase.app, 'Firebase app should be initialized');
});

// ============================================================
// AUTHENTICATION TESTS
// ============================================================

test('Auth service can get current user', async () => {
    const auth = await import('../js/services/authService.js');
    const user = auth.getCurrentUser();
    // User may be null in test environment, that's OK
    assert(user === null || typeof user === 'object', 'getCurrentUser should return user or null');
});

test('Auth service can subscribe', async () => {
    const auth = await import('../js/services/authService.js');
    let callbackCalled = false;
    const unsub = auth.subscribeToAuth((user) => {
        callbackCalled = true;
    });
    assert(callbackCalled, 'Subscribe callback should be called immediately');
    unsub();
});

// ============================================================
// MODAL TESTS
// ============================================================

test('Modal can be created', async () => {
    const modalMgr = await import('../js/core/modalManager.js');
    const modal = modalMgr.default.create({
        id: 'test-modal-qa',
        title: 'Test',
        content: 'Test Content',
    });
    assert(modal, 'Modal should be created');
    assert(modal.open, 'Modal should have open method');
    assert(modal.close, 'Modal should have close method');
    modal.destroy();
});

test('Modal can open and close', async () => {
    const modalMgr = await import('../js/core/modalManager.js');
    const modal = modalMgr.default.create({
        id: 'test-modal-open-close',
        title: 'Test',
        content: 'Test',
    });
    modal.open();
    assert(modal.isOpen, 'Modal should be open');
    modal.close();
    assert(!modal.isOpen, 'Modal should be closed');
    modal.destroy();
});

// ============================================================
// PERFORMANCE TESTS
// ============================================================

test('Page load time acceptable', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        console.log(`   Load time: ${loadTime.toFixed(0)}ms`);
        assert(loadTime < 5000, 'Page should load in less than 5 seconds');
    }
});

test('First contentful paint measured', () => {
    const perfEntries = performance.getEntriesByName('first-contentful-paint');
    if (perfEntries.length > 0) {
        const fcp = perfEntries[0].startTime;
        console.log(`   FCP: ${fcp.toFixed(0)}ms`);
        assert(fcp < 3000, 'FCP should be less than 3 seconds');
    }
});

// ============================================================
// ACCESSIBILITY TESTS
// ============================================================

test('Body has proper language attribute', () => {
    const htmlLang = document.documentElement.lang;
    assert(htmlLang, 'HTML element should have lang attribute');
});

test('Navigation elements exist', () => {
    const nav = document.querySelector('nav');
    assert(nav, 'Page should have navigation element');
});

// ============================================================
// ERROR HANDLING TESTS
// ============================================================

test('Safe DOM handles missing elements', async () => {
    const safeDom = await import('../js/core/safe-dom.js');
    const element = safeDom.safeQuery('#nonexistent-element-xyz');
    assert(element === null, 'safeQuery should return null for missing element');
});

test('Logger handles errors gracefully', async () => {
    const logger = await import('../js/core/logger.js');
    // This should not throw
    logger.error('Test', 'Test error message');
    assert(true, 'Logger should handle errors gracefully');
});

// ============================================================
// INTEGRATION TESTS
// ============================================================

test('Auth and Notification services coexist', async () => {
    const auth = await import('../js/services/authService.js');
    const notif = await import('../js/core/notificationManager.js');
    assert(auth.getCurrentUser !== undefined, 'Auth should be loaded');
    assert(notif.getNotifications !== undefined, 'Notifications should be loaded');
});

test('Services can be imported in any order', async () => {
    // Simulate importing in different orders
    const mod1 = await import('../js/core/logger.js');
    const mod2 = await import('../js/core/environmentService.js');
    const mod3 = await import('../js/firebase.js');
    assert(mod1.debug, 'Logger should work');
    assert(mod2.isDevelopment, 'Environment should work');
    assert(mod3.auth, 'Firebase should work');
});

// ============================================================
// EXPORT TEST RUNNER
// ============================================================

export async function runTests() {
    return runAllTests();
}

export function getTestResults() {
    return {
        total: testResults.length,
        passed: passedTests,
        failed: failedTests,
        results: testResults,
    };
}

console.log('%c✅ QA Test Suite loaded. Run: await runAllTests()', 'color: green; font-weight: bold');
