(function () {
    const MODE_PROMPTS = {
        explain: 'Explain this lesson in simple language with practical examples.',
        quiz: 'Create five quiz questions based on this lesson. Ask one question at a time.',
        practice: 'Give me a practical exercise related to this lesson and evaluate my answer.',
        example: 'Provide three real-world examples that demonstrate this concept.',
        summarize: 'Summarize this lesson into concise revision notes.',
        teach: 'Teach this lesson as if you are my personal tutor. Pause after each major concept and ask if I understand before continuing.',
        exam: 'Create a comprehensive revision session including important concepts, likely exam questions, model answers and revision tips.'
    };

    const QUICK_PROMPTS = {
        flashcards: 'Generate concise flashcards from this lesson with question and answer format.',
        notes: 'Create clean study notes from this lesson with key headings and bullet points.',
        revision: 'Build a focused 20-minute revision plan for this lesson with priority topics.',
        test: 'Test my knowledge on this lesson with mixed difficulty questions and brief feedback.',
        ask: 'I have a question about this lesson. Help me clearly and step-by-step.'
    };

    function setPrompt(inputEl, text) {
        if (!inputEl) return;

        inputEl.value = text;
        inputEl.focus();

        if (typeof inputEl.setSelectionRange === 'function') {
            const end = inputEl.value.length;
            inputEl.setSelectionRange(end, end);
        }

        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function activateButton(button) {
        if (!button) return;

        const toolbar = button.closest('[data-teaching-toolbar], [data-quick-toolbar]');
        if (!toolbar) return;

        toolbar.querySelectorAll('.teaching-mode-btn').forEach((btn) => {
            btn.classList.remove('is-active');
            btn.setAttribute('aria-pressed', 'false');
        });

        button.classList.add('is-active');
        button.setAttribute('aria-pressed', 'true');
    }

    function initTeacherHeader(options = {}) {
        const toolbar = document.querySelector(options.toolbarSelector || '[data-teaching-toolbar]');
        const quickToolbar = document.querySelector(options.quickToolbarSelector || '[data-quick-toolbar]');
        const inputEl = document.querySelector(options.inputSelector || '#aiInput');

        if (!inputEl) return;

        if (toolbar) {
            toolbar.querySelectorAll('.teaching-mode-btn').forEach((button) => {
                button.addEventListener('click', () => {
                    const mode = button.getAttribute('data-mode') || '';
                    const prompt = MODE_PROMPTS[mode] || button.getAttribute('data-prompt') || '';
                    if (!prompt) return;

                    setPrompt(inputEl, prompt);
                    activateButton(button);
                });
            });
        }

        if (quickToolbar) {
            quickToolbar.querySelectorAll('.teaching-mode-btn').forEach((button) => {
                button.addEventListener('click', () => {
                    const mode = button.getAttribute('data-quick') || '';
                    const prompt = QUICK_PROMPTS[mode] || button.getAttribute('data-prompt') || '';
                    if (!prompt) return;

                    setPrompt(inputEl, prompt);
                    activateButton(button);
                });
            });
        }
    }

    window.TeacherHeader = {
        initTeacherHeader,
        MODE_PROMPTS,
        QUICK_PROMPTS
    };
})();
