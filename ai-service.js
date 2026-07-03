/*
 * Centralized AI Service for Sword Institute LMS
 * OpenRouter-compatible (OpenFrontier API endpoint)
 *
 * Security note:
 * - Prefer a backend proxy endpoint for production.
 * - Direct browser API key usage is for development only.
 */
(function (global) {
    'use strict';

    const DEFAULT_CONFIG = {
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'openai/gpt-3.5-turbo',
        fallbackModel: 'mistralai/mistral-7b-instruct',
        temperature: 0.6,
        maxTokens: 400,
        timeoutMs: 18000,
        maxHistory: 10,
        // If set, requests are sent to your backend proxy instead of OpenRouter directly.
        proxyUrl: '',
        apiKey: ''
    };

    class SwordAIService {
        constructor() {
            this.config = { ...DEFAULT_CONFIG };
            this.initialized = false;
            this.messageHistory = [];
        }

        initAIService(userConfig = {}) {
            this.config = {
                ...DEFAULT_CONFIG,
                ...(global.SWORD_AI_CONFIG || {}),
                ...userConfig
            };

            if (!this.config.apiKey && typeof global.SWORD_AI_API_KEY === 'string') {
                this.config.apiKey = global.SWORD_AI_API_KEY.trim();
            }

            this.initialized = true;
            return true;
        }

        async sendAIMessage(message, page = 'general', context = {}) {
            const question = String(message || '').trim();
            if (!question) {
                return 'Please enter a question so I can help.';
            }

            if (!this.initialized) {
                this.initAIService();
            }

            const promptBundle = this.buildPrompt(question, page, context);

            try {
                const text = await this.callApi(promptBundle, false);
                this.pushToHistory('user', question);
                this.pushToHistory('assistant', text);
                return text;
            } catch (error) {
                console.error('[AIService] API unavailable, using fallback:', error);
                return this.getFallbackResponse(question, page, context);
            }
        }

        async getLearningRecommendations(studentData = {}) {
            const context = {
                studentData,
                intent: 'recommendation'
            };

            const request = 'Provide personalized learning guidance for this student.';

            if (!this.initialized) {
                this.initAIService();
            }

            const promptBundle = this.buildPrompt(request, 'dashboard', context, true);

            try {
                const structured = await this.callApi(promptBundle, true);
                return {
                    success: true,
                    recommendations: this.normalizeRecommendation(structured, studentData)
                };
            } catch (error) {
                console.error('[AIService] Recommendation API error, using fallback:', error);
                return {
                    success: true,
                    recommendations: this.getFallbackRecommendation(studentData)
                };
            }
        }

        buildPrompt(message, page, context, structuredOutput) {
            const studentData = context.studentData || {};
            const lessonContext = context.lessonContext || {};
            const courseHints = context.courseHints || [];

            const systemPrompt = [
                'You are Sword Institute AI Mentor.',
                'You help learners with course questions, personalized recommendations, lesson explanations, motivation, and study tips.',
                'Tone: warm, practical, concise, and encouraging.',
                'Do not invent platform features. If uncertain, be transparent and provide practical next steps.'
            ].join(' ');

            const pageGuidance = {
                homepage: 'The user is on the homepage and may be exploring courses or onboarding steps.',
                dashboard: 'The user is on the dashboard and expects personalized progression guidance.',
                lesson: 'The user is on a lesson page and needs concept explanations grounded in current lesson context.',
                general: 'The user needs general Sword Institute mentorship.'
            };

            const contextPayload = {
                page,
                pageGuidance: pageGuidance[page] || pageGuidance.general,
                studentData: {
                    userName: studentData.userName || '',
                    totalXp: studentData.totalXp || 0,
                    enrolledCount: Array.isArray(studentData.enrolledCourses) ? studentData.enrolledCourses.length : 0,
                    completedCount: Array.isArray(studentData.completedCourses) ? studentData.completedCourses.length : 0
                },
                lessonContext: {
                    courseName: lessonContext.courseName || '',
                    lessonTitle: lessonContext.lessonTitle || '',
                    lessonSummary: lessonContext.lessonSummary || ''
                },
                courseHints
            };

            const outputInstruction = structuredOutput
                ? 'Return STRICT JSON only with keys: greeting, message, recommendation, tip, motivation.'
                : 'Return plain text only.';

            const userPrompt = [
                outputInstruction,
                'User request:',
                message,
                'Known context (JSON):',
                JSON.stringify(contextPayload)
            ].join('\n\n');

            const messages = [
                { role: 'system', content: systemPrompt },
                ...this.messageHistory.slice(-this.config.maxHistory),
                { role: 'user', content: userPrompt }
            ];

            return { messages, structuredOutput };
        }

        async callApi(promptBundle, structuredOutput) {
            const hasProxy = Boolean(this.config.proxyUrl);
            const hasApiKey = Boolean(this.config.apiKey);

            if (!hasProxy && !hasApiKey) {
                throw new Error('No AI proxy URL or API key configured.');
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

            try {
                const url = hasProxy ? this.config.proxyUrl : this.config.endpoint;

                const headers = {
                    'Content-Type': 'application/json'
                };

                if (!hasProxy) {
                    headers.Authorization = `Bearer ${this.config.apiKey}`;
                    headers['HTTP-Referer'] = global.location ? global.location.origin : 'https://sword-institute.local';
                    headers['X-Title'] = 'Sword Institute LMS';
                }

                const payload = {
                    model: this.config.model,
                    messages: promptBundle.messages,
                    temperature: this.config.temperature,
                    max_tokens: this.config.maxTokens
                };

                let response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                // Retry once with fallback model for OpenRouter direct calls.
                if (!response.ok && !hasProxy && this.config.fallbackModel) {
                    payload.model = this.config.fallbackModel;
                    response = await fetch(url, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(payload),
                        signal: controller.signal
                    });
                }

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`AI request failed (${response.status}): ${errText}`);
                }

                const data = await response.json();
                const content = data && data.choices && data.choices[0] && data.choices[0].message
                    ? data.choices[0].message.content
                    : '';

                if (!content) {
                    throw new Error('AI response content is empty.');
                }

                if (structuredOutput) {
                    return this.safeParseRecommendation(content);
                }

                return content.trim();
            } finally {
                clearTimeout(timeout);
            }
        }

        safeParseRecommendation(content) {
            // Extract the first JSON object if the model wraps it in extra text.
            const match = content.match(/\{[\s\S]*\}/);
            const jsonText = match ? match[0] : content;
            return JSON.parse(jsonText);
        }

        normalizeRecommendation(parsed, studentData) {
            const fallback = this.getFallbackRecommendation(studentData);
            if (!parsed || typeof parsed !== 'object') {
                return fallback;
            }

            return {
                greeting: parsed.greeting || fallback.greeting,
                message: parsed.message || fallback.message,
                recommendation: parsed.recommendation || fallback.recommendation,
                tip: parsed.tip || fallback.tip,
                motivation: parsed.motivation || fallback.motivation
            };
        }

        pushToHistory(role, content) {
            this.messageHistory.push({ role, content });
            if (this.messageHistory.length > this.config.maxHistory * 2) {
                this.messageHistory = this.messageHistory.slice(-this.config.maxHistory * 2);
            }
        }

        getFallbackResponse(message, page, context = {}) {
            const lower = message.toLowerCase();
            const lessonTitle = context.lessonContext && context.lessonContext.lessonTitle
                ? context.lessonContext.lessonTitle
                : 'this lesson';

            if (lower.includes('recommend') || lower.includes('next course')) {
                return 'Based on your journey, start with one core course and complete it before adding another. A strong next step is Community Development Methodologies or Communication Skills.';
            }
            if (lower.includes('study') || lower.includes('tip')) {
                return 'Try a focused cycle: 25 minutes study, 5 minutes break, then write a 3-line summary from memory before moving on.';
            }
            if (lower.includes('motivat') || lower.includes('encourag')) {
                return 'You are making meaningful progress. Small, consistent learning sessions build real long-term impact.';
            }
            if (page === 'lesson' && (lower.includes('explain') || lower.includes('summary') || lower.includes('what is'))) {
                return `This question connects directly to ${lessonTitle}. Review the highlighted key points and identify one real-world application to lock in understanding.`;
            }
            if (page === 'homepage') {
                return 'Welcome to Sword Institute. I can help you choose a course path, understand program outcomes, and plan your first week of study.';
            }
            return 'I am here to help with courses, recommendations, lesson explanations, and study planning. Ask a specific question and I will guide you.';
        }

        getFallbackRecommendation(studentData = {}) {
            const enrolledCount = Array.isArray(studentData.enrolledCourses) ? studentData.enrolledCourses.length : 0;
            const completedCount = Array.isArray(studentData.completedCourses) ? studentData.completedCourses.length : 0;
            const name = studentData.userName || 'Warrior';

            if (enrolledCount === 0) {
                return {
                    greeting: `Hello, ${name}.`,
                    message: 'Welcome to Sword Institute. Your learning journey starts now.',
                    recommendation: 'Start with Communication Skills or Introduction to Community Health.',
                    tip: 'Study 20 minutes daily for one week to build momentum.',
                    motivation: 'Consistency beats intensity. Keep showing up.'
                };
            }

            if (completedCount < enrolledCount) {
                return {
                    greeting: `Hello, ${name}.`,
                    message: `You are progressing through ${enrolledCount} enrolled course(s).`,
                    recommendation: 'Finish your current course before adding more. Then choose one complementary topic.',
                    tip: 'At the end of each lesson, write one action you can apply immediately.',
                    motivation: 'You are closer than you think. Keep moving forward.'
                };
            }

            return {
                greeting: `Hello, ${name}.`,
                message: 'Great work completing your enrolled learning path.',
                recommendation: 'Expand into a new category to broaden your real-world impact skills.',
                tip: 'Teach one concept to someone else to strengthen retention.',
                motivation: 'Your growth can uplift entire communities. Continue the mission.'
            };
        }
    }

    global.AIService = new SwordAIService();
})(window);
