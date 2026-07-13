export function installBrowserSmokeTest(options = {}) {
  const target = options.target || (typeof window !== 'undefined' ? window : globalThis);
  const resultContainer = options.resultContainer || null;

  if (!target || typeof target !== 'object') {
    throw new Error('A browser window-like object is required for smoke testing.');
  }

  const run = async () => {
    const checks = [];

    const addCheck = (name, passed, detail = '') => {
      checks.push({ name, passed, detail });
    };

    try {
      const hasAiService = typeof target.AIService !== 'undefined';
      addCheck('AI service is exposed', hasAiService, hasAiService ? 'window.AIService available' : 'window.AIService missing');

      if (hasAiService && typeof target.AIService.initAIService === 'function') {
        const initialized = target.AIService.initAIService();
        addCheck('AI service initializes', Boolean(initialized), initialized ? 'initialized successfully' : 'initialization returned false');
      }

      if (hasAiService && typeof target.AIService.sendAIMessage === 'function') {
        const reply = await target.AIService.sendAIMessage('Give me a brief study tip.', 'smoke-test');
        addCheck('AI message flow works', Boolean(reply), reply ? reply.slice(0, 80) : 'empty response');
      }

      if (resultContainer && typeof resultContainer === 'object') {
        resultContainer.innerHTML = `
          <div style="font-family:inherit; color:#0f766e;">
            <strong>Smoke test result:</strong>
            <ul>
              ${checks.map((check) => `<li>${check.passed ? '✅' : '❌'} ${check.name}${check.detail ? ` — ${check.detail}` : ''}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      return {
        success: checks.every((check) => check.passed),
        checks
      };
    } catch (error) {
      if (resultContainer && typeof resultContainer === 'object') {
        resultContainer.innerHTML = `<div style="color:#b91c1c;">Smoke test failed: ${error.message}</div>`;
      }
      return {
        success: false,
        checks,
        error: error.message
      };
    }
  };

  target.__browserSmokeTest = run;
  return run;
}

export async function runBrowserSmokeTest(options = {}) {
  const runner = installBrowserSmokeTest(options);
  return runner();
}
