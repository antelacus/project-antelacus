import test from 'node:test';
import assert from 'node:assert/strict';

import { searchEntries } from '../src/lib/search-filter';

// visual-upgrade DESIGN §2.2 — the search's matching and ordering, without a browser.

const item = (title: string, date: string, extra: { summary?: string; tags?: string[] } = {}) => ({ title, date, summary: extra.summary, tags: extra.tags ?? [] });
const items = [
  item('Lake notes', '2026-01-01', { summary: 'On water' }),
  item('Garden', '2026-03-01', { summary: 'A lake in the garden' }),
  item('Stones', '2026-02-01', { tags: ['lake'] }),
  item('湖边的三段笔记', '2025-12-01', { summary: '合成的中文专栏' }),
];
const titles = (query: string) => searchEntries(items, query).map((i) => i.title);

test('an empty query lists everything, newest first', () => {
  assert.deepEqual(titles('  '), ['Garden', 'Stones', 'Lake notes', '湖边的三段笔记']);
});

test('a title match ranks above a tag match, which ranks above a summary match', () => {
  assert.deepEqual(titles('lake'), ['Lake notes', 'Stones', 'Garden']);
});

test('matching ignores case and width, and every word must match somewhere', () => {
  assert.deepEqual(titles('LAKE water'), ['Lake notes']);
  assert.deepEqual(titles('ｌａｋｅ'), ['Lake notes', 'Stones', 'Garden']);
  assert.deepEqual(titles('lake nothing'), []);
});

test('Chinese is matched as written, without word breaks', () => {
  assert.deepEqual(titles('湖边'), ['湖边的三段笔记']);
  assert.deepEqual(titles('中文'), ['湖边的三段笔记']);
});
