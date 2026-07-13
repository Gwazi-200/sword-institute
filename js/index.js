/**
 * ==========================================================
 * Sword Institute LMS
 * Homepage Controller
 * Version: 2.0.0 (Production)
 * ==========================================================
 *
 * Safe DOM manipulation with null checks
 * Deferred execution until DOMContentLoaded
 * No initialization of services (handled by manager)
 * ==========================================================
 */

import {
    safeQuery,
    safeQueryAll,
    safeSetStyle,
    safeAddListener,
    safeSetText,
    safeAddClass,
    onDOMReady
} from './core/safe-dom.js';

import { debug, info, warn, section } from './core/logger.js';

const MODULE = 'HomePage';

// ========================================================
// DEFERRED INITIALIZATION (executes after DOM ready)
// ========================================================

async function initializeHomepage() {
    section('Homepage Initialization');

    // ========================================================
    // HERO BUTTON EFFECTS
    // ========================================================

    function initHeroButtons() {
        const buttons = safeQueryAll('.btn');
        buttons.forEach(button => {
            safeAddListener(button, 'mouseenter', () => {
                safeSetStyle(button, 'transform', 'translateY(-3px)');
            });

            safeAddListener(button, 'mouseleave', () => {
                safeSetStyle(button, 'transform', '');
            });
        });

        if (buttons.length > 0) {
            info(MODULE, `✔ Hero buttons initialized (${buttons.length} buttons)`);
        }
    }

    // ========================================================
    // MENTOR FLOATING EFFECT
    // ========================================================

    function initMentorCard() {
        const mentorCard = safeQuery('.mentor-card');
        if (!mentorCard) {
            debug(MODULE, 'Mentor card not found (may not be on this page)');
            return;
        }

        let direction = 1;
        const animationInterval = setInterval(() => {
            safeSetStyle(mentorCard, 'transform', `translateY(${direction * 8}px)`);
            direction *= -1;
        }, 2000);

        // Store interval ID for cleanup if needed
        window.__mentorAnimationInterval = animationInterval;
        info(MODULE, '✔ Mentor card floating effect initialized');
    }

    // ========================================================
    // COUNTER ANIMATION
    // ========================================================

    function animateCounter(counter) {
        const target = Number(counter.dataset.target || 0);
        if (target === 0) return;

        let current = 0;
        const speed = target / 120;

        function update() {
            current += speed;
            if (current < target) {
                safeSetText(counter, Math.floor(current).toString());
                requestAnimationFrame(update);
            } else {
                safeSetText(counter, target.toLocaleString());
            }
        }

        update();
    }

    // ========================================================
    // INTERSECTION OBSERVER FOR ANIMATIONS
    // ========================================================

    function initObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Animate counters
                    if (entry.target.classList.contains('counter')) {
                        animateCounter(entry.target);
                    }

                    // Add visible class
                    safeAddClass(entry.target, 'visible');
                }
            });
        }, { threshold: 0.25 });

        // Observe all animated elements
        const animates = safeQueryAll('.animate');
        const counters = safeQueryAll('.counter');

        animates.forEach(el => observer.observe(el));
        counters.forEach(el => observer.observe(el));

        info(MODULE, `✔ Intersection Observer initialized (${animates.length + counters.length} elements)`);
    }

    // ========================================================
    // SMOOTH SCROLL NAVIGATION
    // ========================================================

    function initSmoothScroll() {
        const anchors = safeQueryAll('a[href^="#"]');

        anchors.forEach((anchor) => {
            safeAddListener(anchor, 'click', (e) => {
                const href = anchor.getAttribute('href');
                if (!href) return;

                const target = safeQuery(href);
                if (!target) return;

                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            });
        });

        if (anchors.length > 0) {
            info(MODULE, `✔ Smooth scroll navigation initialized (${anchors.length} anchors)`);
        }
    }

    // ========================================================
    // PROFESSOR SWORD MESSAGE ROTATION
    // ========================================================

    function initMentorRotation() {
        const mentorTitle = safeQuery('.mentor-message h2');
        const mentorTip = safeQuery('.mentor-tip');

        if (!mentorTitle || !mentorTip) {
            debug(MODULE, 'Mentor message elements not found (may not be on this page)');
            return;
        }

        const mentorMessages = [
            {
                title: 'Communication Skills',
                text: 'Every great leader begins by listening.'
            },
            {
                title: 'Leadership',
                text: 'Lead with integrity and inspire others.'
            },
            {
                title: 'AI Basic Education',
                text: 'AI is your assistant—not your replacement.'
            },
            {
                title: 'Entrepreneurship',
                text: 'Every successful business starts with one idea.'
            },
            {
                title: 'Community Development',
                text: 'Communities grow when knowledge is shared.'
            }
        ];

        let current = 0;

        function rotateMentorMessage() {
            current++;
            if (current >= mentorMessages.length) current = 0;

            const msg = mentorMessages[current];
            safeSetText(mentorTitle, msg.title);
            safeSetText(mentorTip, `💡 ${msg.text}`);
        }

        // Start rotation after showing first message
        const rotationInterval = setInterval(rotateMentorMessage, 7000);
        window.__mentorRotationInterval = rotationInterval;

        info(MODULE, '✔ Professor SWORD message rotation initialized');
    }

    // ========================================================
    // SCROLL INDICATOR
    // ========================================================

    function initScrollIndicator() {
        const indicator = safeQuery('.scroll-indicator');
        if (!indicator) {
            debug(MODULE, 'Scroll indicator not found (may not be on this page)');
            return;
        }

        safeAddListener(window, 'scroll', () => {
            const opacity = window.scrollY > 150 ? '0' : '1';
            safeSetStyle(indicator, 'opacity', opacity);
        });

        info(MODULE, '✔ Scroll indicator initialized');
    }

    // ========================================================
    // PAGE LOAD COMPLETE
    // ========================================================

    function initPageLoad() {
        safeAddListener(window, 'load', () => {
            safeAddClass(document.body, 'loaded');
        });

        info(MODULE, '✔ Page load handler initialized');
    }

    // ========================================================
    // RUN ALL INITIALIZATIONS
    // ========================================================

    try {
        initHeroButtons();
        initMentorCard();
        initObserver();
        initSmoothScroll();
        initMentorRotation();
        initScrollIndicator();
        initPageLoad();

        info(MODULE, '✅ Homepage initialization complete');
    } catch (err) {
        warn(MODULE, 'Homepage initialization error', err);
    }
}

// ========================================================
// START INITIALIZATION
// ========================================================

await onDOMReady();
await initializeHomepage();

info(MODULE, '✅ Homepage ready');
