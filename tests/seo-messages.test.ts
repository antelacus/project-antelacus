import test from 'node:test';
import assert from 'node:assert/strict';

import { getMetaMessage } from '../src/lib/seo';

// CLAUDE.md: a key missing from a locale falls back to `en`. The shell's skip link depends on it.

test('a key missing from a locale falls back to the English text, not the key name', async () => {
  const english = await getMetaMessage('en', 'utility.language');
  assert.equal(english, 'Language');
  assert.equal(await getMetaMessage('xx', 'utility.language'), english, 'unknown locale');
  assert.equal(await getMetaMessage('fr', 'utility.no_such_key'), 'utility.no_such_key', 'a key nobody has still yields something printable');
});
