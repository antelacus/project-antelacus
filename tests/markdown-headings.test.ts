import test from 'node:test';
import assert from 'node:assert/strict';

import { renderToStaticMarkup } from 'react-dom/server';

import { extractToc, renderMarkdown } from '../src/lib/markdown';

// visual-upgrade DESIGN §2.2, invariant 20 — the page's h1 belongs to its opening, so a body's headings
// start at h2 and never skip a level; every heading has a unique id, and the table of contents is the
// h2 of the very same pipeline.

const html = (source: string) => renderToStaticMarkup(renderMarkdown(source));
const headings = (source: string) => [...html(source).matchAll(/<h([1-6]) id="([^"]*)">([\s\S]*?)<\/h\1>/g)].map(([, level, id, text]) => ({ level: Number(level), id, text }));

test('invariant 20 — the body\'s top heading renders as h2 and levels close up instead of skipping', () => {
  assert.deepEqual(headings('# One\n\n### Deep\n\n# Two\n\n###### Deeper').map((h) => h.level), [2, 3, 2, 3]);
  assert.deepEqual(headings('## A\n\n#### B\n\n### C').map((h) => h.level), [2, 3, 3]);
  assert.deepEqual(headings('### Only\n\n### Level').map((h) => h.level), [2, 2]);
  assert.doesNotMatch(html('# Title\n\ntext'), /<h1/);
});

test('invariant 20 — every heading id is unique, readable, and never the page\'s own', () => {
  const ids = headings('## Intro\n\n## Intro\n\n## 第一节\n\n## ！？\n\n## Main content\n\n## ！？').map((h) => h.id);
  assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids}`);
  assert.deepEqual(ids.slice(0, 3), ['intro', 'intro-2', '第一节']);
  assert.ok(ids.every((id) => id.length > 0 && !/\s/.test(id)), `bad ids: ${ids}`);
  assert.ok(!ids.includes('main-content'), 'a heading took the id of <main>');
});

test('invariant 20 — the table of contents is the rendered h2, id for id', () => {
  const source = '# A\n\n## sub\n\n# A\n\n# B *em*\n\n### deep';
  const toc = extractToc(source);
  const h2 = headings(source).filter((h) => h.level === 2);
  assert.deepEqual(toc.map((item) => item.id), h2.map((h) => h.id));
  assert.deepEqual(toc.map((item) => item.text), ['A', 'A', 'B em']);
});

test('the table of contents counts h2 only, so two sections stay two and three stay three', () => {
  assert.equal(extractToc('## a\n\n## b\n\n### c').length, 2);
  assert.equal(extractToc('## a\n\n## b\n\n## c').length, 3);
  assert.equal(extractToc('no headings').length, 0);
});
