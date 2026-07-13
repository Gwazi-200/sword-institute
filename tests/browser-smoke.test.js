const test = require('node:test');
const assert = require('node:assert/strict');

test('browser smoke helper exposes a runnable API', async () => {
  const mod = await import('./browser-smoke.js');

  assert.equal(typeof mod.runBrowserSmokeTest, 'function');
  assert.equal(typeof mod.installBrowserSmokeTest, 'function');
});
