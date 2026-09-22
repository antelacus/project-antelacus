'use client';

import { useState } from 'react';

export type EditorImage = { storage_path: string; public_url: string; alt_text: string };

type Props = {
  images: EditorImage[];
  cover: string;
  onChange(images: EditorImage[]): void;
  onCoverChange(cover: string): void;
  onUpload(file: File): Promise<{ url: string; path: string }>;
  onError?(message: string): void;
};

// An album's photos: upload several, order them, caption them, pick the cover from among them.
export default function GalleryImagesPanel({ images, cover, onChange, onCoverChange, onUpload, onError }: Props) {
  const [busy, setBusy] = useState(false);

  const move = (index: number, delta: number) => {
    const next = images.slice();
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const addFiles = async (files: File[]) => {
    setBusy(true);
    const added: EditorImage[] = [];
    for (const file of files) {
      try {
        const uploaded = await onUpload(file);
        added.push({ storage_path: uploaded.path, public_url: uploaded.url, alt_text: '' });
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Upload failed');
      }
    }
    if (added.length) onChange([...images, ...added]);
    setBusy(false);
  };

  return (
    <fieldset className="admin-card" style={{ display: 'grid', gap: '0.75rem', border: '1px solid rgba(29, 29, 27, 0.14)' }}>
      <legend style={{ fontWeight: 600 }}>Photos ({images.length})</legend>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.75rem' }}>
        {images.map((image, index) => (
          <li key={image.storage_path} style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '5rem 1fr auto', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a thumbnail of what was just uploaded */}
            <img src={image.public_url} alt="" style={{ width: '5rem', height: '5rem', objectFit: 'cover', borderRadius: '6px' }} />
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <input
                value={image.alt_text}
                placeholder="Caption / alt text"
                onChange={(event) => onChange(images.map((item, i) => (i === index ? { ...item, alt_text: event.target.value } : item)))}
              />
              <label style={{ fontSize: '0.85rem' }}>
                <input type="radio" name="cover-choice" checked={cover === image.public_url} onChange={() => onCoverChange(image.public_url)} /> cover
              </label>
            </div>
            <div style={{ display: 'grid', gap: '0.25rem' }}>
              <button type="button" className="admin-button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">↑</button>
              <button type="button" className="admin-button" onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label="Move down">↓</button>
              <button type="button" className="admin-button" onClick={() => onChange(images.filter((_, i) => i !== index))} aria-label="Remove">×</button>
            </div>
          </li>
        ))}
      </ol>
      <label className="admin-button" style={{ justifySelf: 'start', opacity: busy ? 0.6 : 1 }}>
        {busy ? 'Uploading…' : 'Add photos'}
        <input type="file" accept="image/*" multiple disabled={busy} style={{ display: 'none' }} onChange={(event) => { void addFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
      </label>
      <input type="hidden" name="images" value={JSON.stringify(images)} />
    </fieldset>
  );
}
