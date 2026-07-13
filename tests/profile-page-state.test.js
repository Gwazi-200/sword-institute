const test = require('node:test');
const assert = require('node:assert/strict');

(async () => {
  const { loadProfileState, saveProfileState, clearProfileState, mergeProfileState } = await import('../js/utils/profilePageState.js');

  test('loadProfileState returns a sanitized default profile', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };

    const profile = loadProfileState(storage);

    assert.equal(profile.fullName, 'Aisha Morgan');
    assert.equal(profile.avatarInitials, 'AM');
  });

  test('saveProfileState persists a trimmed profile payload', () => {
    const stored = {};
    const storage = {
      getItem: (key) => stored[key] || null,
      setItem: (key, value) => {
        stored[key] = value;
      },
      removeItem: (key) => {
        delete stored[key];
      },
    };

    const profile = saveProfileState({ fullName: '  Jane Doe  ', bio: '  Ready to grow  ' }, storage);

    assert.equal(profile.fullName, 'Jane Doe');
    assert.equal(profile.bio, 'Ready to grow');
    assert.equal(profile.avatarInitials, 'JD');
  });

  test('clearProfileState removes the stored profile', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };

    const profile = clearProfileState(storage);
    assert.equal(profile.fullName, 'Aisha Morgan');
  });

  test('mergeProfileState prefers remote profile values while keeping defaults', () => {
    const merged = mergeProfileState(
      { fullName: 'Aisha Morgan', email: 'aisha@example.com', bio: 'Local bio' },
      { fullName: 'Aisha Okafor', profession: 'Product Designer', bio: '', country: 'Kenya' }
    );

    assert.equal(merged.fullName, 'Aisha Okafor');
    assert.equal(merged.profession, 'Product Designer');
    assert.equal(merged.country, 'Kenya');
    assert.equal(merged.email, 'aisha@example.com');
    assert.equal(merged.bio, 'Local bio');
  });
})();
