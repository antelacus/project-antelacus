import type { ReactNode } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import rehypeReact from 'rehype-react';

import { rawHtmlAsText } from './raw-html-as-text';
import { dropProtocolRelativeUrls } from './url-policy';
import { imageRows } from './image-rows';
import { headings, tocOf, type TocItem } from './headings';

export type { TocItem };

// The one renderer for database content, on the server for public pages and in the browser for the
// admin preview — so it imports nothing server-only. Order matters: raw HTML becomes text before the
// tree is built, the sanitizer runs before KaTeX so it only ever sees what Markdown itself produced
// (KaTeX's own output is trusted by construction), and the image-row rule runs after the sanitizer
// because it introduces markup the whitelist need not know about; so does the heading rule, whose ids the
// sanitizer would otherwise prefix.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(rawHtmlAsText)
  .use(remarkRehype)
  .use(dropProtocolRelativeUrls)
  // The default schema admits GFM tables and task lists, but on <code> only `language-*` classes:
  // remark-math's `math-display` would be stripped and every block formula would render inline, so the
  // two math classes are added. href/src protocols are limited to http, https and mailto.
  .use(rehypeSanitize, {
    ...defaultSchema,
    attributes: { ...defaultSchema.attributes, code: [['className', /^language-./, 'math-inline', 'math-display']] },
    protocols: { ...defaultSchema.protocols, href: ['http', 'https', 'mailto'], src: ['http', 'https'] },
  })
  .use(imageRows)
  .use(headings)
  // Bounds on macro expansion and glyph size so a pathological formula cannot pin the renderer.
  .use(rehypeKatex, { maxExpand: 1000, maxSize: 100 })
  .use(rehypeReact, { Fragment, jsx, jsxs });

export function renderMarkdown(source: string): ReactNode {
  return processor.processSync(source).result as ReactNode;
}

/** The body's h2 as the renderer ids them: the same pipeline, so a contents link always has its target. */
export function extractToc(source: string): TocItem[] {
  return tocOf(processor.runSync(processor.parse(source)));
}
