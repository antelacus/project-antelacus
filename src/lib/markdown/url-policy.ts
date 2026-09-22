import type { Root } from 'hast';
import { visit } from 'unist-util-visit';

const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

// Two things the sanitizer gets wrong on its own: a protocol-relative address (`//host/x`) counts as
// relative and gets through although it is an external origin in disguise, and a scheme is compared
// case-sensitively although schemes are not (`HTTPS://…` would lose its href). The first is dropped
// here, the second lowercased, before the sanitizer sees either.
export function dropProtocolRelativeUrls() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      for (const key of ['href', 'src'] as const) {
        const value = node.properties?.[key];
        if (typeof value !== 'string') continue;
        if (value.startsWith('//')) delete node.properties[key];
        else node.properties[key] = value.replace(SCHEME, (scheme) => scheme.toLowerCase());
      }
    });
  };
}
