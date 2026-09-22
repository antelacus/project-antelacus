'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { saveContentAction, type SaveState } from '@/app/admin/(protected)/content/actions';
import { locales } from '@/i18n/routing';
import type { ContentStatus, ContentType } from '@/lib/server/database.types';
import GalleryImagesPanel, { type EditorImage } from './GalleryImagesPanel';
import MarkdownEditor from './MarkdownEditor';
import MarkdownPreview from './MarkdownPreview';
import ProjectLinksPanel, { type EditorLink } from './ProjectLinksPanel';

export type EditorValue = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  lang: string;
  cover: string;
  displayDate: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  status: ContentStatus;
  images: EditorImage[];
  links: EditorLink[];
};

type Props = {
  type: ContentType;
  initial: EditorValue | null;
  notice: { saved: string; stale: boolean } | null;
};

const empty = (lang: string): EditorValue => ({
  slug: '', title: '', summary: '', content: '', lang, cover: '', displayDate: '', tags: '', seoTitle: '', seoDescription: '',
  status: 'draft', images: [], links: [],
});

// datetime-local wants YYYY-MM-DDTHH:mm; the database gives a full ISO string.
const dateInput = (value: string) => (value.includes('T') ? value.slice(0, 16) : value);

function SubmitButton({ intent, children, primary }: { intent: 'draft' | 'publish'; children: string; primary?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name="intent" value={intent} disabled={pending} className={`admin-button${primary ? ' admin-button-primary' : ''}`}>
      {pending ? 'Saving…' : children}
    </button>
  );
}

export default function ContentEditor({ type, initial, notice }: Props) {
  const [state, formAction] = useActionState<SaveState, FormData>(saveContentAction, null);
  const [value, setValue] = useState<EditorValue>(initial ?? empty(locales[0]));
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const errors = state?.errors ?? {};
  const set = <K extends keyof EditorValue>(key: K, next: EditorValue[K]) => setValue((current) => ({ ...current, [key]: next }));

  // The body is backed up in this tab as it is typed, so a failed save or a lost tab does not lose it.
  const draftKey = `editor:${type}:${initial?.slug ?? 'new'}`;
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(draftKey);
      if (stored && !initial?.content) setValue((current) => ({ ...current, content: stored }));
    } catch { /* storage may be unavailable; the form still works */ }
  }, [draftKey, initial?.content]);
  useEffect(() => {
    try { sessionStorage.setItem(draftKey, value.content); } catch { /* ignore */ }
  }, [draftKey, value.content]);

  const upload = async (file: File) => {
    if (!value.slug) throw new Error('Set the slug before uploading, it names the folder');
    const body = new FormData();
    body.set('file', file);
    body.set('type', type);
    body.set('slug', value.slug);
    const res = await fetch('/api/admin/upload', { method: 'POST', body });
    const json = (await res.json()) as { url?: string; path?: string; error?: string };
    if (!res.ok || !json.url || !json.path) throw new Error(json.error ?? `Upload failed (${res.status})`);
    return { url: json.url, path: json.path };
  };

  return (
    <form action={formAction} style={{ display: 'grid', gap: '1rem' }}>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={initial?.id ?? ''} />
      <input type="hidden" name="content" value={value.content} />
      <input type="hidden" name="cover" value={value.cover} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: 'var(--color-seal)', fontSize: '0.95rem' }}>
            <Link href={`/admin/content/${type}`} style={{ borderBottom: 'none' }}>{type}s</Link> / {initial ? initial.slug : 'new'}
          </p>
          <h2 style={{ margin: '0.35rem 0 0' }}>{initial ? initial.title : `New ${type}`}</h2>
        </div>
        <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>{initial ? initial.status : 'not saved yet'}</span>
      </div>

      {notice && (
        <p role="status" className="admin-notice">
          Saved as <strong>{notice.saved}</strong>.{notice.stale && ' The public pages could not be refreshed on the spot; they will show it within half an hour.'}
        </p>
      )}
      {(state?.message || error) && <p role="alert" className="admin-notice admin-notice-error">{state?.message ?? error}</p>}

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
        <Field label="Title" error={errors.title}><input name="title" value={value.title} onChange={(e) => set('title', e.target.value)} required /></Field>
        <Field label="Slug" error={errors.slug}><input name="slug" value={value.slug} onChange={(e) => set('slug', e.target.value)} pattern="[a-z0-9-]{1,80}" required /></Field>
      </div>

      <Field label="Summary" error={errors.summary}><textarea name="summary" value={value.summary} onChange={(e) => set('summary', e.target.value)} rows={3} /></Field>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' }}>
        <Field label="Written in" error={errors.lang}>
          <select name="lang" value={value.lang} onChange={(e) => set('lang', e.target.value)}>
            {locales.map((locale) => <option key={locale} value={locale}>{locale}</option>)}
          </select>
        </Field>
        <Field label="Display date" error={errors.displayDate}><input type="datetime-local" name="displayDate" value={dateInput(value.displayDate)} onChange={(e) => set('displayDate', e.target.value)} /></Field>
        <Field label="Tags (comma separated)" error={errors.tags}><input name="tags" value={value.tags} onChange={(e) => set('tags', e.target.value)} /></Field>
      </div>

      {type !== 'gallery' && (
        <Field label="Cover" error={errors.cover}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={value.cover} placeholder="https://… or upload" onChange={(e) => set('cover', e.target.value)} style={{ flex: '1 1 16rem' }} />
            <label className="admin-button">
              Upload cover
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) upload(file).then((u) => set('cover', u.url)).catch((err: Error) => setError(err.message)); }} />
            </label>
          </div>
        </Field>
      )}

      {type === 'gallery' && (
        <GalleryImagesPanel images={value.images} cover={value.cover} onChange={(images) => set('images', images)} onCoverChange={(cover) => set('cover', cover)} onUpload={upload} onError={setError} />
      )}
      {type === 'project' && <ProjectLinksPanel links={value.links} onChange={(links) => set('links', links)} error={errors.links} />}

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span>{type === 'gallery' ? 'Notes (optional)' : 'Body'}{errors.content && <span style={{ color: 'var(--color-seal)' }}> — {errors.content}</span>}</span>
          <button type="button" className="admin-button" onClick={() => setShowPreview((v) => !v)}>{showPreview ? 'Hide preview' : 'Preview'}</button>
        </div>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: showPreview ? 'repeat(auto-fit, minmax(20rem, 1fr))' : '1fr' }}>
          <MarkdownEditor value={value.content} onChange={(content) => set('content', content)} onUpload={(file) => upload(file).then((u) => u.url)} onError={setError} />
          {showPreview && <MarkdownPreview value={value.content} />}
        </div>
      </div>

      <details>
        <summary style={{ cursor: 'pointer' }}>Search engine title and description</summary>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '0.75rem' }}>
          <Field label="SEO title" error={errors.seoTitle}><input name="seoTitle" value={value.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} /></Field>
          <Field label="SEO description" error={errors.seoDescription}><textarea name="seoDescription" value={value.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} rows={2} /></Field>
        </div>
      </details>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', position: 'sticky', bottom: 0, padding: '0.75rem 0', background: 'var(--color-paper)' }}>
        <SubmitButton intent="draft">{initial?.status === 'published' ? 'Retract to draft' : 'Save draft'}</SubmitButton>
        <SubmitButton intent="publish" primary>{initial?.status === 'published' ? 'Publish changes' : 'Publish'}</SubmitButton>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '0.4rem' }}>
      <span>{label}{error && <span style={{ color: 'var(--color-seal)' }}> — {error}</span>}</span>
      {children}
    </label>
  );
}
