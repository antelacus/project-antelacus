import test from 'node:test';
import assert from 'node:assert/strict';

import { getSafeNextPath } from '../src/lib/safe-next-path';

// REQ §5.11-a — the open-redirect guard.

test('acceptance §5.11-a only a same-site path is followed', () => {
  for (const bad of [undefined, null, '', 'admin', '//evil.example/x', 'https://evil.example', '/x://evil', '/a\\evil', '/a\r\nSet-Cookie: x', 42]) {
    assert.equal(getSafeNextPath(bad, '/fallback'), '/fallback', JSON.stringify(bad));
  }
  assert.equal(getSafeNextPath('/zh-CN/about?ref=1', '/fallback'), '/zh-CN/about?ref=1');
});

test('acceptance §5.11-a `within` is compared by segment', () => {
  assert.equal(getSafeNextPath('/admin/notes', '/admin', '/admin'), '/admin/notes');
  assert.equal(getSafeNextPath('/admin', '/admin', '/admin'), '/admin');
  assert.equal(getSafeNextPath('/admin?x=1', '/admin', '/admin'), '/admin?x=1');
  assert.equal(getSafeNextPath('/administrator', '/admin', '/admin'), '/admin');
  assert.equal(getSafeNextPath('/en/about', '/admin', '/admin'), '/admin');
});
