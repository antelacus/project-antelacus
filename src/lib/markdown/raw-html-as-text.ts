import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';

// Raw HTML, JSX and anything else Markdown does not understand is shown as the text it is. Without
// this, remark-rehype silently drops `html` nodes — the author would lose content instead of seeing it.
export function rawHtmlAsText() {
  return (tree: Root) => {
    visit(tree, 'html', (node) => {
      const text = node as unknown as { type: string };
      text.type = 'text';
    });
  };
}
