// REQ visual-upgrade §5.1-b — the admin templates, logged in as the seeded synthetic admin.
import test from 'node:test';
import assert from 'node:assert/strict';

const h = () => import('./harness.mjs');

test('acceptance §5.1-b the four admin templates have zero axe violations', { todo: 'Batch 6' }, async () => {
  const { visitAdmin, axe, ADMIN_TEMPLATES } = await h();
  const failures = [];
  await visitAdmin(ADMIN_TEMPLATES, async (page, t) => {
    for (const v of await axe(page)) failures.push(`${t.name}: ${v.id} ×${v.nodes.length}`);
  });
  assert.deepEqual(failures, []);
});
