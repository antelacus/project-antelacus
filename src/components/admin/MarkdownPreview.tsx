'use client';

import { renderMarkdown } from '@/lib/markdown';

// The same renderer as the public pages, under the same `.prose` styles: what you see is what ships.
export default function MarkdownPreview({ value }: { value: string }) {
  return <div className="prose admin-preview">{value.trim() ? renderMarkdown(value) : <p style={{ opacity: 0.6 }}>Nothing to preview yet.</p>}</div>;
}
