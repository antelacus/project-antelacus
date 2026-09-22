import type { Element, ElementContent, Root } from 'hast';
import { visit } from 'unist-util-visit';

const isImage = (node: ElementContent): node is Element => node.type === 'element' && node.tagName === 'img';
const isBlank = (node: ElementContent) => node.type === 'text' && node.value.trim() === '';

// A paragraph that holds nothing but images becomes a row of figures, each captioned by its `title`.
// Layout is the renderer's business: the body says which images belong together, never how to lay
// them out. (One image alone becomes a one-figure row, so a caption works there too.)
export function imageRows() {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent || index === undefined) return;
      const images = node.children.filter(isImage);
      if (images.length === 0 || !node.children.every((child) => isImage(child) || isBlank(child))) return;

      const figures: Element[] = images.map((img) => {
        const title = typeof img.properties.title === 'string' ? img.properties.title : '';
        const { title: _dropped, ...properties } = img.properties;
        void _dropped;
        const children: ElementContent[] = [{ ...img, properties }];
        if (title) children.push({ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: title }] });
        return { type: 'element', tagName: 'figure', properties: {}, children };
      });
      parent.children[index] = { type: 'element', tagName: 'div', properties: { className: ['image-row'] }, children: figures };
    });
  };
}
