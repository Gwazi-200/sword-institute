/**
 * ============================================================
 * Sword Institute LMS
 * Academies Module
 * Version: 2.0.0 (Production)
 * ============================================================
 *
 * Features:
 * - Safe DOM access
 * - Error handling with fallback UI
 * - Course count enrichment
 * - AI-powered academy guidance
 * ============================================================
 */

import { getAllCourses } from './services/courseService.js';
import { auth } from './firebase.js';
import {
    safeQuery,
    safeSetHTML,
    safeSetText,
    onDOMReady
} from './core/safe-dom.js';
import { info, warn, error, debug } from './core/logger.js';

const MODULE = 'Academies';

const ACADEMY_DATA = [
    {
        id: 'sacred-ai-academy',
        slug: 'sacred-ai-academy',
        title: '🤖 Sacred AI Academy',
        subtitle: 'Artificial Intelligence, Prompt Engineering & Automation',
        accent: '#8B00FF',
        icon: '🤖',
        coursesCount: 4,
        learningPaths: 6,
        certificates: 3,
        hours: '42h',
        level: 'Foundation',
        welcome: 'Step into the future with practical AI fluency, prompt design, and modern automation workflows.',
        overview: 'The Sacred AI Academy blends hands-on technical practice with responsible adoption so learners can build real-world AI capability across teams and communities.',
        roadmap: ['Foundations of AI and responsible use', 'Prompt engineering and workflow automation', 'Applied AI for productivity and community impact'],
        certificates: ['AI Foundations Certificate', 'Prompt Engineering Badge', 'Automation Practitioner Certificate'],
        outcomes: ['Accelerate daily productivity', 'Design credible AI workflows', 'Lead AI-enabled initiatives with confidence'],
        stories: ['A community organizer launched a digital outreach system in weeks.', 'A public servant automated reporting and reduced manual effort.'],
        featured: ['AI Foundations', 'Prompt Engineering Essentials', 'Automation for Social Impact'],
        beginner: ['AI Essentials', 'Prompt Design Basics'],
        intermediate: ['Workflow Automation', 'AI for Teams'],
        advanced: ['Applied AI Strategy', 'Responsible AI Leadership']
    },
    {
        id: 'sacred-management-administration-academy',
        slug: 'sacred-management-administration-academy',
        title: '🏛 Sacred Management & Administration Academy',
        subtitle: 'Leadership, Office Administration & Strategic Management',
        accent: '#7C3AED',
        icon: '🏛',
        coursesCount: 4,
        learningPaths: 5,
        certificates: 2,
        hours: '36h',
        level: 'Professional',
        welcome: 'Lead with clarity, structure, and purpose through practical management and administration training.',
        overview: 'This academy equips learners to strengthen operations, manage people and priorities, and lead professional environments with ease.',
        roadmap: ['Administrative excellence', 'Strategic planning and execution', 'Leadership communication and accountability'],
        certificates: ['Administrative Excellence Certificate', 'Leadership Operations Badge'],
        outcomes: ['Improve team coordination', 'Streamline office systems', 'Lead administrative transformation'],
        stories: ['A team lead introduced stronger routines for a fast-moving office.', 'An administrator increased stakeholder confidence by modernizing workflows.'],
        featured: ['Executive Administration', 'People Leadership Essentials', 'Strategic Operations'],
        beginner: ['Office Systems Basics', 'Leadership Foundations'],
        intermediate: ['Operations Management', 'Team Coordination'],
        advanced: ['Strategic Management', 'Executive Leadership']
    },
    {
        id: 'sacred-community-development-academy',
        slug: 'sacred-community-development-academy',
        title: '🌍 Sacred Community Development Academy',
        subtitle: 'NGOs, CBOs, Community Empowerment & Social Impact',
        accent: '#0F766E',
        icon: '🌍',
        coursesCount: 4,
        learningPaths: 5,
        certificates: 3,
        hours: '40h',
        level: 'Foundation',
        welcome: 'Drive meaningful change through community-centered leadership and social impact design.',
        overview: 'This academy is built for learners who want to serve communities with stronger systems, deeper partnerships, and more resilient programs.',
        roadmap: ['Community needs assessment', 'Program design and partnerships', 'Impact measurement and sustainability'],
        certificates: ['Community Development Certificate', 'Impact Design Badge', 'Social Innovation Certificate'],
        outcomes: ['Design stronger community programs', 'Mobilize local partnerships', 'Lead social impact initiatives'],
        stories: ['A youth initiative expanded services through better planning.', 'A local NGO improved outreach by focusing on measurable outcomes.'],
        featured: ['Community Development Methodologies', 'Social Impact Design', 'Participatory Program Planning'],
        beginner: ['Community Engagement Basics', 'Needs Assessment'],
        intermediate: ['Program Design', 'Partnership Development'],
        advanced: ['Impact Strategy', 'Social Innovation Leadership']
    },
    {
        id: 'sacred-business-entrepreneurship-academy',
        slug: 'sacred-business-entrepreneurship-academy',
        title: '💼 Sacred Business & Entrepreneurship Academy',
        subtitle: 'Business Innovation, Finance & Digital Entrepreneurship',
        accent: '#C2410C',
        icon: '💼',
        coursesCount: 4,
        learningPaths: 5,
        certificates: 3,
        hours: '38h',
        level: 'Professional',
        welcome: 'Turn bold ideas into sustainable ventures through practical business and finance training.',
        overview: 'The academy focuses on startup thinking, revenue strategy, and digital business models that support resilient growth.',
        roadmap: ['Opportunity discovery', 'Financial literacy and planning', 'Growth and digital transformation'],
        certificates: ['Entrepreneurship Foundations Certificate', 'Digital Business Badge', 'Finance for Leaders Certificate'],
        outcomes: ['Launch smarter ventures', 'Understand finance and growth', 'Scale with intention'],
        stories: ['An entrepreneur refined her model and launched with stronger confidence.', 'A small business owner improved cash flow clarity through better planning.'],
        featured: ['Entrepreneurship Foundations', 'Finance for Social Ventures', 'Digital Business Design'],
        beginner: ['Business Essentials', 'Financial Literacy'],
        intermediate: ['Growth Strategy', 'Sales and Marketing Basics'],
        advanced: ['Scale-Up Planning', 'Innovation Leadership']
    },
    {
        id: 'sacred-psychology-counselling-academy',
        slug: 'sacred-psychology-counselling-academy',
        title: '🧠 Sacred Psychology & Counselling Academy',
        subtitle: 'Mental Health, Counselling & Human Development',
        accent: '#DB2777',
        icon: '🧠',
        coursesCount: 4,
        learningPaths: 5,
        certificates: 3,
        hours: '44h',
        level: 'Mastery',
        welcome: 'Develop empathetic, evidence-informed skills that support wellbeing and human growth.',
        overview: 'This academy blends psychological insight with counseling tools to help learners support people with care and professionalism.',
        roadmap: ['Self-awareness and ethics', 'Counselling fundamentals', 'Applied wellbeing and support systems'],
        certificates: ['Counselling Foundations Certificate', 'Wellbeing Support Badge', 'Human Development Certificate'],
        outcomes: ['Support others with confidence', 'Recognize wellbeing needs', 'Create safer support environments'],
        stories: ['A counsellor-in-training built stronger rapport with clients.', 'A community leader improved support systems for vulnerable groups.'],
        featured: ['Counselling Foundations', 'Human Development Essentials', 'Mental Health Awareness'],
        beginner: ['Introduction to Counselling', 'Self-Awareness'],
        intermediate: ['Support Strategies', 'Crisis Awareness'],
        advanced: ['Advanced Counselling Practice', 'Wellbeing Leadership']
    },
    {
        id: 'sacred-governance-public-leadership-academy',
        slug: 'sacred-governance-public-leadership-academy',
        title: '⚖ Sacred Governance & Public Leadership Academy',
        subtitle: 'Governance, Policy, Ethics & Public Administration',
        accent: '#2563EB',
        icon: '⚖',
        coursesCount: 4,
        learningPaths: 5,
        certificates: 3,
        hours: '40h',
        level: 'Professional',
        welcome: 'Lead public institutions and governance initiatives with ethics, insight, and accountability.',
        overview: 'This academy prepares learners for leadership roles that shape policy, public trust, and fair institutions.',
        roadmap: ['Governance foundations', 'Policy analysis and ethics', 'Public leadership and accountability'],
        certificates: ['Governance Certificate', 'Ethics and Leadership Badge', 'Public Administration Certificate'],
        outcomes: ['Strengthen public systems', 'Lead with ethics', 'Drive accountable decision-making'],
        stories: ['A public officer redesigned procedures to improve transparency.', 'A team leader introduced more inclusive governance practices.'],
        featured: ['Governance Essentials', 'Ethics in Leadership', 'Policy Analysis Basics'],
        beginner: ['Public Leadership Basics', 'Policy Fundamentals'],
        intermediate: ['Governance Systems', 'Ethical Decision-Making'],
        advanced: ['Strategic Public Leadership', 'Policy Implementation']
    },
    {
        id: 'sacred-health-wellbeing-academy',
        slug: 'sacred-health-wellbeing-academy',
        title: '❤️ Sacred Health & Wellbeing Academy',
        subtitle: 'Community Health, Wellness & Health Promotion',
        accent: '#DC2626',
        icon: '❤️',
        coursesCount: 4,
        learningPaths: 5,
        certificates: 3,
        hours: '38h',
        level: 'Foundation',
        welcome: 'Build healthier communities through practical wellness, prevention, and health promotion training.',
        overview: 'This academy supports learners who want to improve lives through practical health education and wellbeing leadership.',
        roadmap: ['Healthy communities', 'Wellbeing promotion', 'Health systems awareness'],
        certificates: ['Wellbeing Certificate', 'Community Health Badge', 'Health Promotion Certificate'],
        outcomes: ['Promote healthier habits', 'Support community wellbeing', 'Design practical health initiatives'],
        stories: ['A health worker improved outreach using simple, repeatable tools.', 'A volunteer team launched wellness sessions that resonated with families.'],
        featured: ['Community Health Basics', 'Wellbeing Promotion', 'Health Education Essentials'],
        beginner: ['Wellness Foundations', 'Healthy Communities'],
        intermediate: ['Health Promotion', 'Community Outreach'],
        advanced: ['Health Leadership', 'Program Delivery']
    },
    {
        id: 'sacred-digital-skills-academy',
        slug: 'sacred-digital-skills-academy',
        title: '🌐 Sacred Digital Skills Academy',
        subtitle: 'Digital Productivity, Microsoft Office, Cybersecurity & Technology',
        accent: '#0EA5E9',
        icon: '🌐',
        coursesCount: 4,
        learningPaths: 6,
        certificates: 3,
        hours: '42h',
        level: 'Foundation',
        welcome: 'Strengthen your digital fluency, productivity, and technology confidence with practical training.',
        overview: 'This academy gives learners the modern tools, habits, and guardrails needed to work confidently and safely in digital spaces.',
        roadmap: ['Digital productivity', 'Microsoft Office and collaboration', 'Cybersecurity and emerging tools'],
        certificates: ['Digital Productivity Certificate', 'Microsoft Office Badge', 'Cybersecurity Essentials Certificate'],
        outcomes: ['Work faster digitally', 'Use tools with confidence', 'Protect data and systems'],
        stories: ['A learner transformed day-to-day productivity using Microsoft Office tools.', 'A professional improved their digital safety habits and confidence.'],
        featured: ['Microsoft Office Essentials', 'Digital Productivity', 'Cybersecurity Basics'],
        beginner: ['Digital Essentials', 'Office Basics'],
        intermediate: ['Productivity Systems', 'Safe Digital Work'],
        advanced: ['Advanced Digital Skills', 'Technology Leadership']
    },
    {
        id: 'sacred-communication-languages-academy',
        slug: 'sacred-communication-languages-academy',
        title: '🗣 Sacred Communication & Languages Academy',
        subtitle: 'Public Speaking, Professional Communication & Languages',
        accent: '#7C2D12',
        icon: '🗣',
        coursesCount: 4,
        learningPaths: 4,
        certificates: 2,
        hours: '34h',
        level: 'Professional',
        welcome: 'Sharpen your voice, language skills, and professional presence with practical communication training.',
        overview: 'This academy helps learners express ideas clearly, connect with confidence, and grow in professional and multicultural settings.',
        roadmap: ['Communication foundations', 'Public speaking and presentation', 'Language confidence and influence'],
        certificates: ['Communication Excellence Certificate', 'Public Speaking Badge'],
        outcomes: ['Speak with confidence', 'Communicate clearly', 'Connect across cultures'],
        stories: ['A learner improved presentation confidence in a matter of weeks.', 'A professional strengthened stakeholder communication with more clarity.'],
        featured: ['Professional Communication', 'Public Speaking Essentials', 'Language Confidence'],
        beginner: ['Communication Basics', 'Listening and Speaking'],
        intermediate: ['Presentation Skills', 'Cross-Cultural Communication'],
        advanced: ['Executive Presence', 'Advanced Communication']
    },
    {
        id: 'sacred-leadership-life-excellence-academy',
        slug: 'sacred-leadership-life-excellence-academy',
        title: '🎓 Sacred Leadership & Life Excellence Academy',
        subtitle: 'Personal Leadership, Critical Thinking & Career Development',
        accent: '#A16207',
        icon: '🎓',
        coursesCount: 4,
        learningPaths: 5,
        certificates: 3,
        hours: '36h',
        level: 'Mastery',
        welcome: 'Grow into your fullest potential with leadership habits, critical thinking, and career direction.',
        overview: 'This academy supports personal growth, stronger decision-making, and career momentum through a thoughtful leadership lens.',
        roadmap: ['Personal leadership', 'Critical thinking and reflection', 'Career growth and professional direction'],
        certificates: ['Leadership Excellence Certificate', 'Career Growth Badge', 'Critical Thinking Certificate'],
        outcomes: ['Lead yourself with intention', 'Think more clearly', 'Advance with purpose'],
        stories: ['A learner moved from hesitation to clear career direction.', 'A professional strengthened confidence and planning habits.'],
        featured: ['Leadership Foundations', 'Critical Thinking Essentials', 'Career Growth'],
        beginner: ['Personal Leadership Basics', 'Career Clarity'],
        intermediate: ['Decision-Making', 'Growth Planning'],
        advanced: ['Professional Leadership', 'Life Excellence Strategy']
    }
];

const academyLookup = new Map(ACADEMY_DATA.map((academy) => [academy.slug, academy]));
let academyCache = null;
let academyFetchPromise = null;

function escapeHTML(text = '') {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getCurrentLevel(academy) {
    if (typeof window === 'undefined') {
        return academy.level;
    }

    try {
        const storedLevel = window.localStorage.getItem('sword_academy_level');
        if (storedLevel) {
            return storedLevel;
        }
    } catch (error) {
        console.warn('Unable to read academy level preference', error);
    }

    try {
        const currentUser = auth?.currentUser;
        if (currentUser) {
            return 'Professional';
        }
    } catch (error) {
        console.warn('Unable to read auth current user', error);
    }

    return academy.level;
}

function getContinueLearning(academy) {
    if (typeof window === 'undefined' || !window.localStorage) {
        return null;
    }

    try {
        const rawState = window.localStorage.getItem('sword_course_state');
        if (!rawState) {
            return null;
        }

        const parsed = JSON.parse(rawState);
        const enrolledEntry = Object.entries(parsed || {}).find(([, entry]) => Boolean(entry?.enrolled));
        if (!enrolledEntry) {
            return null;
        }

        const [courseId, entry] = enrolledEntry;
        const progress = typeof entry?.progress === 'number' ? Math.max(0, Math.min(100, entry.progress)) : 0;
        return {
            title: `${academy.title} continue learning`,
            description: `You are ${progress}% through your active path. Resume the next lesson and keep your momentum strong.`,
            progress,
            courseId
        };
    } catch (error) {
        console.warn('Unable to read continue learning state', error);
        return null;
    }
}

function createAcademyCard(academy) {
    const currentLevel = getCurrentLevel(academy);

    return `
        <a class="academy-card" href="academy.html?slug=${academy.slug}" aria-label="Explore ${academy.title}">
            <div class="academy-card__header">
                <div class="academy-card__icon" aria-hidden="true">${academy.icon}</div>
                <span class="academy-card__tag">${escapeHTML(currentLevel)}</span>
            </div>
            <div>
                <h3 class="academy-card__title">${escapeHTML(academy.title)}</h3>
                <p class="academy-card__subtitle">${escapeHTML(academy.subtitle)}</p>
            </div>
            <div class="academy-card__footer">
                <span class="academy-card__level">⬢ ${escapeHTML(currentLevel)}</span>
                <span class="academy-card__button">Explore</span>
            </div>
        </a>
    `;
}

function createAcademyDetailPage(academy, continueLearning = null) {
    return `
        <article class="academy-detail-page">
            <div class="academy-shell">
                <section class="academy-hero" style="border-left: 8px solid ${academy.accent};">
                    <div class="academy-hero__top">
                        <div>
                            <div class="academy-hero__icon" aria-hidden="true">${academy.icon}</div>
                            <h1 class="academy-hero__title">${escapeHTML(academy.title)}</h1>
                            <p class="academy-hero__subtitle">${escapeHTML(academy.subtitle)}</p>
                        </div>
                        <div class="academy-pill">🎓 ${escapeHTML(academy.level)} Level</div>
                    </div>
                    <p style="margin-top: 16px; color: var(--text-secondary, #4B3A5C); line-height: 1.7;">${escapeHTML(academy.welcome)}</p>
                    <div class="academy-hero__stats">
                        <span class="academy-pill">📚 ${academy.coursesCount} Courses</span>
                        <span class="academy-pill">🧭 ${academy.learningPaths} Learning Paths</span>
                        <span class="academy-pill">🏅 ${academy.certificates} Certificates</span>
                        <span class="academy-pill">⏱ ${academy.hours}</span>
                    </div>
                </section>

                ${continueLearning ? `
                <section class="academy-section-card" aria-labelledby="academy-continue-heading">
                    <h3 id="academy-continue-heading">Continue Learning</h3>
                    <p>${escapeHTML(continueLearning.description)}</p>
                    <div class="academy-guidance" role="status">
                        <strong>Resume progress</strong>
                        <span>${escapeHTML(continueLearning.title)} • ${continueLearning.progress}% complete</span>
                    </div>
                </section>
                ` : ''}

                <section class="academy-section-card" aria-labelledby="academy-overview-heading">
                    <h2 id="academy-overview-heading">Welcome to ${escapeHTML(academy.title)}</h2>
                    <p>${escapeHTML(academy.overview)}</p>
                    <div class="academy-guidance" role="status">
                        <strong>Professor SWORD guidance</strong>
                        <span id="academy-guidance-${academy.slug}">Loading your tailored recommendation…</span>
                    </div>
                </section>

                <section class="academy-section-card" aria-labelledby="academy-featured-heading">
                    <h3 id="academy-featured-heading">Featured Courses</h3>
                    <div class="academy-grid">
                        ${academy.featured.map((course) => `<div class="academy-course-card"><h4>${escapeHTML(course)}</h4><p>Premium, practice-led learning content.</p></div>`).join('')}
                    </div>
                </section>

                <section class="academy-section-card" aria-labelledby="academy-levels-heading">
                    <h3 id="academy-levels-heading">Academy Levels</h3>
                    <div class="academy-grid">
                        <div class="academy-course-card"><h4>Foundation</h4><p>Build confidence and core understanding.</p></div>
                        <div class="academy-course-card"><h4>Professional</h4><p>Apply skills in practical settings.</p></div>
                        <div class="academy-course-card"><h4>Mastery</h4><p>Lead, refine, and mentor others.</p></div>
                    </div>
                    <div class="academy-guidance" role="status" style="margin-top: 12px;">
                        <strong>Current level</strong>
                        <span>${escapeHTML(getCurrentLevel(academy))}</span>
                    </div>
                </section>

                <section class="academy-section-card" aria-labelledby="academy-beginner-heading">
                    <h3 id="academy-beginner-heading">Beginner Courses</h3>
                    <div class="academy-grid">
                        ${academy.beginner.map((course) => `<div class="academy-course-card"><h4>${escapeHTML(course)}</h4><p>Start with practical foundations and bite-sized learning steps.</p></div>`).join('')}
                    </div>
                </section>

                <section class="academy-section-card" aria-labelledby="academy-intermediate-heading">
                    <h3 id="academy-intermediate-heading">Intermediate Courses</h3>
                    <div class="academy-grid">
                        ${academy.intermediate.map((course) => `<div class="academy-course-card"><h4>${escapeHTML(course)}</h4><p>Build confidence through guided practice and stronger application.</p></div>`).join('')}
                    </div>
                </section>

                <section class="academy-section-card" aria-labelledby="academy-advanced-heading">
                    <h3 id="academy-advanced-heading">Advanced Courses</h3>
                    <div class="academy-grid">
                        ${academy.advanced.map((course) => `<div class="academy-course-card"><h4>${escapeHTML(course)}</h4><p>Advance into leadership-ready practice and strategic execution.</p></div>`).join('')}
                    </div>
                </section>

                <section class="academy-section-card" aria-labelledby="academy-roadmap-heading">
                    <h3 id="academy-roadmap-heading">Learning Roadmap</h3>
                    <div class="academy-roadmap-list">
                        ${academy.roadmap.map((step) => `<div class="academy-roadmap-item">${escapeHTML(step)}</div>`).join('')}
                    </div>
                </section>

                <section class="academy-section-card" aria-labelledby="academy-certificates-heading">
                    <h3 id="academy-certificates-heading">Certificates</h3>
                    <div class="academy-roadmap-list">
                        ${academy.certificates.map((certificate) => `<div class="academy-roadmap-item">${escapeHTML(certificate)}</div>`).join('')}
                    </div>
                </section>

                <section class="academy-section-card" aria-labelledby="academy-outcomes-heading">
                    <h3 id="academy-outcomes-heading">Career Outcomes</h3>
                    <div class="academy-outcome-list">
                        ${academy.outcomes.map((outcome) => `<div class="academy-outcome-item">${escapeHTML(outcome)}</div>`).join('')}
                    </div>
                </section>

                <section class="academy-section-card" aria-labelledby="academy-stories-heading">
                    <h3 id="academy-stories-heading">Student Success Stories</h3>
                    <div class="academy-story-list">
                        ${academy.stories.map((story) => `<div class="academy-story-item">${escapeHTML(story)}</div>`).join('')}
                    </div>
                </section>
            </div>
        </article>
    `;
}

function renderAcademyCards(container) {
    if (!container) return;
    const visibleAcademies = ACADEMY_DATA.slice(0, 10);
    safeSetHTML(container, visibleAcademies.map(createAcademyCard).join(''));
}

function renderSkeleton(container) {
    if (!container) return;
    const skeleton = '<div class="academy-skeleton">' +
        Array.from({ length: 6 }, () => '<div class="academy-skeleton__card"></div>').join('') +
        '</div>';
    safeSetHTML(container, skeleton);
}

async function renderAcademyPage(container) {
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const academy = academyLookup.get(slug) || ACADEMY_DATA[0];
    const continueLearning = getContinueLearning(academy);

    safeSetHTML(container, createAcademyDetailPage(academy, continueLearning));

    const guidance = safeQuery(`#academy-guidance-${academy.slug}`);
    if (guidance) {
        const message = await getAcademyGuidance(academy);
        safeSetText(guidance, message);
    }
}

async function getAcademyGuidance(academy) {
    try {
        if (typeof window !== 'undefined' && window.AIService && typeof window.AIService.sendAIMessage === 'function') {
            const response = await window.AIService.sendAIMessage(`Give me a concise recommendation for ${academy.title} and how I should begin learning.`, 'academy');
            return response || 'Professor SWORD recommends starting with the foundation path and building momentum one module at a time.';
        }
    } catch (error) {
        console.warn('Academy guidance unavailable', error);
    }

    return `Professor SWORD recommends starting with the foundation path in ${academy.title} and building momentum through one practical module at a time.`;
}

export async function initAcademies() {
    const academyGrid = safeQuery('#academiesContainer');
    const academyPage = safeQuery('#academyPage');

    if (!academyGrid && !academyPage) {
        debug(MODULE, 'Academy containers not found (not on academies page)');
        return;
    }

    try {
        if (academyGrid) {
            renderSkeleton(academyGrid);

            try {
                const courses = await getAllCourses();

                if (courses && courses.length > 0) {
                    const featuredCourses = courses.filter(
                        (course) => course.featured || course.popular || course.category
                    );

                    const courseCountByAcademy = new Map();

                    ACADEMY_DATA.forEach((academy) => {
                        const keyword = academy.title.split(' ')[1]?.toLowerCase() || academy.slug.toLowerCase();
                        const count = featuredCourses.filter((course) =>
                            String(course.category || '').toLowerCase().includes(keyword)
                        ).length;
                        courseCountByAcademy.set(
                            academy.slug,
                            Math.max(academy.coursesCount, count || academy.coursesCount)
                        );
                    });

                    const enriched = ACADEMY_DATA.map((academy) => ({
                        ...academy,
                        coursesCount: courseCountByAcademy.get(academy.slug) || academy.coursesCount
                    }));

                    const visibleAcademies = enriched.slice(0, 10);
                    safeSetHTML(academyGrid, visibleAcademies.map(createAcademyCard).join(''));

                    info(MODULE, `✔ Rendered ${visibleAcademies.length} academies`);
                } else {
                    renderAcademyCards(academyGrid);
                }
            } catch (err) {
                warn(MODULE, 'Failed to fetch courses, using static data', err);
                renderAcademyCards(academyGrid);
            }
        }

        if (academyPage) {
            await renderAcademyPage(academyPage);
        }

        info(MODULE, '✅ Academies initialized');
    } catch (err) {
        error(MODULE, 'Failed to initialize academies', err);
    }
}

export function getAcademyData() {
    return ACADEMY_DATA;
}

// Export globally for access if needed
if (typeof window !== 'undefined') {
    window.SwordAcademies = { initAcademies, getAcademyData };
}

// Initialize when DOM is ready
async function bootstrapAcademies() {
    await onDOMReady();
    await initAcademies();
}

bootstrapAcademies().catch(err => {
    error(MODULE, 'Failed to bootstrap academies', err);
});
