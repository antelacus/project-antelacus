import type { Element, ElementContent, Root } from 'hast';
import { visit } from 'unist-util-visit';

import { PAGE_IDS } from '@/lib/page-ids';

// A body's headings, made to fit under the page's own h1: the highest level used becomes h2, deeper
// levels follow in rank, and a jump of more than one level closes up. Each heading gets an id from its
// text, unique on the page: never one the page itself uses, nor one the pipeline already gave another
// element (footnotes). The footnotes section's own heading is the pipeline's and is left as it is.
// Runs after the sanitizer and before KaTeX, so a heading's contents label is its words and formula
// source, recorded here, not the rendered maths.

export type TocItem = { id: string; text: string };
type HeadingData = { tocText?: string };

const levelOf = (node: Element) => Number(node.tagName[1]);

// What a reader would call the heading: its text, with an image standing for its alt text.
function textOf(node: ElementContent | Element): string {
  if (node.type === 'text') return node.value;
  if (node.type !== 'element') return '';
  if (node.tagName === 'img') return String(node.properties?.alt ?? '');
  return node.children.map(textOf).join('');
}

function slug(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function headings() {
  return (tree: Root) => {
    const found: Element[] = [];
    const used = new Set<string>(Object.values(PAGE_IDS));
    visit(tree, 'element', (node, _index, parent) => {
      if (node.properties?.id) used.add(String(node.properties.id));
      const inFootnotes = parent?.type === 'element' && parent.properties?.dataFootnotes !== undefined;
      if (/^h[1-6]$/.test(node.tagName) && !inFootnotes) found.push(node);
    });
    if (found.length === 0) return;

    const rank = new Map([...new Set(found.map(levelOf))].sort().map((level, i) => [level, i + 2]));
    let previous = 1;
    for (const node of found) {
      const level = Math.min(rank.get(levelOf(node))!, previous + 1, 6);
      node.tagName = `h${level}`;
      previous = level;

      const text = textOf(node).trim();
      const base = slug(text) || 'section';
      let id = base;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
      node.properties = { ...node.properties, id };
      node.data = { ...node.data, tocText: text } as Element['data'] & HeadingData;
    }
  };
}

/** The body's own h2 that have words, as the heading step labelled them. */
export function tocOf(tree: Root): TocItem[] {
  const items: TocItem[] = [];
  visit(tree, 'element', (node) => {
    const text = (node.data as HeadingData | undefined)?.tocText;
    if (node.tagName === 'h2' && text) items.push({ id: String(node.properties?.id), text });
  });
  return items;
}
