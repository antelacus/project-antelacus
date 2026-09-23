// REQ visual-upgrade §5.5 — the gate proves it did not idle. Listed last by scripts/ui-check.sh: it reads
// what the other files' accessibility checks recorded, so all files run in one process.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { CONTEXTS, closeBrowsers, judgedCoverage, requiredCoverage, visit, axe } from './harness.mjs';

after(closeBrowsers);

const missing = (required) => {
  const judged = judgedCoverage();
  return required.filter((c) => !judged.has(c.key)).map((c) => c.key);
};

test('acceptance §5.5-a axe judged every template at rest in every context, and every admin template', (t) => {
  const required = requiredCoverage().filter((c) => !c.state);
  t.diagnostic(`axe judged ${required.length - missing(required).length} of ${required.length} combinations at rest`);
  assert.deepEqual(missing(required), []);
});

test('acceptance §5.5-a axe judged every template in its interactive state', { todo: 'Batch 5' }, () => {
  assert.deepEqual(missing(requiredCoverage().filter((c) => c.state)), []);
});

// Whatever the pages' own state, the check must see a violation that is there: a check that cannot
// fail passes on anything.
test('the accessibility check reports a planted nameless button in every context', async () => {
  await visit(Object.keys(CONTEXTS), [{ name: 'planted', path: '/en/no-such-section', status: 404 }], async (page) => {
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'planted-violation';
      document.querySelector('main').append(button);
    });
    const buttonName = (await axe(page)).find((v) => v.id === 'button-name');
    assert.ok(buttonName?.nodes.some((n) => n.target.includes('#planted-violation')), 'axe missed the planted button');
  });
});
