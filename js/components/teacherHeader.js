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

        const toolbar = button.closest('[data-teaching-toolbar]');
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
        const inputEl = document.querySelector(options.inputSelector || '#aiInput');

        if (!toolbar || !inputEl) return;

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

    window.TeacherHeader = {
        initTeacherHeader,
        MODE_PROMPTS
    };
})();
