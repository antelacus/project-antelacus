'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { savePageAction, type PageSaveState } from '@/app/admin/(protected)/pages/actions';
import type { ContentStatus } from '@/lib/server/database.types';
import MarkdownEditor from './MarkdownEditor';
import MarkdownPreview from './MarkdownPreview';

type Props = {
  slug: string;
  locale: string;
  initial: { title: string; body: string; status: ContentStatus } | null;
  notice: { saved: string; stale: boolean } | null;
};

function SubmitButton({ intent, children, primary }: { intent: 'draft' | 'publish'; children: string; primary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name="intent" value={intent} disabled={pending} className={`admin-button${primary ? ' admin-button-primary' : ''}`}>
      {pending ? 'Saving…' : children}
    </button>
  );
}

// One language of a standalone page: a title and a Markdown body. Text only — a page has no uploads.
export default function PageEditor({ slug, locale, initial, notice }: Props) {
  const [state, formAction] = useActionState<PageSaveState, FormData>(savePageAction, null);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [showPreview, setShowPreview] = useState(false);
  const errors = state?.errors ?? {};
  const published = initial?.status === 'published';

  return (
    <form action={formAction} style={{ display: 'grid', gap: '1rem' }}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="body" value={body} />
      {/* Enter in the title submits through the first submit button; this one keeps the version's status. */}
      <button type="submit" name="intent" value={published ? 'publish' : 'draft'} hidden aria-hidden tabIndex={-1} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: 'var(--color-seal)', fontSize: '0.95rem' }}>
            <Link href={`/admin/pages/${slug}`} style={{ borderBottom: 'none' }}>/{slug}</Link> / {locale}
          </p>
          <h2 style={{ margin: '0.35rem 0 0' }}>{initial ? initial.title : `New ${locale} version`}</h2>
        </div>
        <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>{initial ? initial.status : 'not saved yet'}</span>
      </div>

      {notice && (
        <p role="status" className="admin-notice">
          Saved as <strong>{notice.saved}</strong>.{notice.stale && ' The public pages could not be refreshed on the spot; they will show it within half an hour.'}
        </p>
      )}
      {state?.message && <p role="alert" className="admin-notice admin-notice-error">{state.message}</p>}

      <label style={{ display: 'grid', gap: '0.4rem' }}>
        <span>Title{errors.title && <span style={{ color: 'var(--color-seal)' }}> — {errors.title}</span>}</span>
        <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span>Body{errors.body && <span style={{ color: 'var(--color-seal)' }}> — {errors.body}</span>}</span>
          <button type="button" className="admin-button" onClick={() => setShowPreview((v) => !v)}>{showPreview ? 'Hide preview' : 'Preview'}</button>
        </div>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: showPreview ? 'repeat(auto-fit, minmax(20rem, 1fr))' : '1fr' }}>
          <div data-editor-body>
            <MarkdownEditor value={body} label="Body" onChange={setBody} />
          </div>
          {showPreview && <MarkdownPreview value={body} />}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', position: 'sticky', bottom: 0, padding: '0.75rem 0', background: 'var(--color-paper)' }}>
        <SubmitButton intent="draft">{published ? 'Retract to draft' : 'Save draft'}</SubmitButton>
        <SubmitButton intent="publish" primary>{published ? 'Publish changes' : 'Publish'}</SubmitButton>
      </div>
    </form>
  );
}
