const test = require('node:test');
const assert = require('node:assert/strict');

function createStorage(value) {
  return {
    getItem(key) {
      if (key === 'sword-institute:settings') {
        return value === undefined ? null : JSON.stringify(value);
      }
      return null;
    },
    setItem() {},
    removeItem() {},
    clear() {},
  };
}

test('getSettings falls back to the default theme for invalid stored themes', async () => {
  global.window = { localStorage: createStorage({ theme: 'not-a-real-theme' }) };
  global.document = {
    documentElement: { setAttribute() {}, style: { setProperty() {} } },
    body: { setAttribute() {} },
  };

  const { getSettings } = await import('../js/services/settingsService.js');
  const settings = getSettings();

  assert.equal(settings.theme, 'pearlescent');
});
