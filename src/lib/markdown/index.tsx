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

// The one renderer for database content, on the server for public pages and in the browser for the
// admin preview — so it imports nothing server-only. Order matters: raw HTML becomes text before the
// tree is built, the sanitizer runs before KaTeX so it only ever sees what Markdown itself produced
// (KaTeX's own output is trusted by construction), and the image-row rule runs after the sanitizer
// because it introduces markup the whitelist need not know about.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(rawHtmlAsText)
  .use(remarkRehype)
  .use(dropProtocolRelativeUrls)
  // The default schema already admits GFM tables and task lists and remark-math's
  // `math-inline`/`math-display` classes; href/src protocols are limited to http, https and mailto.
  .use(rehypeSanitize, {
    ...defaultSchema,
    protocols: { ...defaultSchema.protocols, href: ['http', 'https', 'mailto'], src: ['http', 'https'] },
  })
  .use(imageRows)
  .use(rehypeKatex)
  .use(rehypeReact, { Fragment, jsx, jsxs });

export function renderMarkdown(source: string): ReactNode {
  return processor.processSync(source).result as ReactNode;
}
