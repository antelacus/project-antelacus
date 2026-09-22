import type { Root } from 'hast';
import { visit } from 'unist-util-visit';

// The sanitizer treats a protocol-relative address (`//host/x`) as relative and lets it through; it is
// an external origin in disguise, so it goes the way of `javascript:` and `data:`.
export function dropProtocolRelativeUrls() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      for (const key of ['href', 'src'] as const) {
        const value = node.properties?.[key];
        if (typeof value === 'string' && value.startsWith('//')) delete node.properties[key];
      }
    });
  };
}
