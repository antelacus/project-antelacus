import type { Element, ElementContent, Root } from 'hast';
import { visit } from 'unist-util-visit';

// A body's headings, made to fit under the page's own h1: the highest level used becomes h2, deeper
// levels follow in rank, and a jump of more than one level closes up. Each heading gets an id from its
// text — unique on the page, and never one the page itself uses. Runs after the sanitizer, whose own
// id rewriting would otherwise prefix these.

const RESERVED_IDS = new Set(['main-content']);

export type TocItem = { id: string; text: string };

const levelOf = (node: Element) => Number(node.tagName[1]);

export function textOf(node: ElementContent | Element): string {
  if (node.type === 'text') return node.value;
  if (node.type === 'element') return node.children.map(textOf).join('');
  return '';
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
    visit(tree, 'element', (node) => {
      if (/^h[1-6]$/.test(node.tagName)) found.push(node);
    });
    if (found.length === 0) return;

    const rank = new Map([...new Set(found.map(levelOf))].sort().map((level, i) => [level, i + 2]));
    const used = new Set(RESERVED_IDS);
    let previous = 1;
    for (const node of found) {
      const level = Math.min(rank.get(levelOf(node))!, previous + 1, 6);
      node.tagName = `h${level}`;
      previous = level;

      const base = slug(textOf(node)) || 'section';
      let id = base;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
      node.properties = { ...node.properties, id };
    }
  };
}

export function tocOf(tree: Root): TocItem[] {
  const items: TocItem[] = [];
  visit(tree, 'element', (node) => {
    if (node.tagName === 'h2') items.push({ id: String(node.properties?.id), text: textOf(node).trim() });
  });
  return items;
}
