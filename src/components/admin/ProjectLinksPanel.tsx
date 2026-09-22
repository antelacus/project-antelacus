'use client';

import type { ProjectLinkType } from '@/lib/server/database.types';

export type EditorLink = { label: string; url: string; link_type: ProjectLinkType };

const LINK_TYPES: ProjectLinkType[] = ['repository', 'demo', 'reference', 'other'];

// The card and the detail page show the repository and the demo; a new link defaults to whichever of
// those is still missing, so the first link added is the one that actually appears.
const nextLinkType = (links: EditorLink[]): ProjectLinkType =>
  !links.some((l) => l.link_type === 'repository') ? 'repository' : !links.some((l) => l.link_type === 'demo') ? 'demo' : 'other';

type Props = { links: EditorLink[]; onChange(links: EditorLink[]): void; error?: string };

// A project's links: label, address, kind. Only the repository and demo kinds are shown on the public pages;
// the others are stored for later.
export default function ProjectLinksPanel({ links, onChange, error }: Props) {
  const update = (index: number, patch: Partial<EditorLink>) => onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)));

  return (
    <fieldset className="admin-card" style={{ display: 'grid', gap: '0.75rem', border: '1px solid rgba(29, 29, 27, 0.14)' }}>
      <legend style={{ fontWeight: 600 }}>Links</legend>
      {links.map((link, index) => (
        <div key={index} style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr) auto auto', alignItems: 'center' }}>
          <input value={link.label} placeholder="Label" onChange={(event) => update(index, { label: event.target.value })} />
          <input value={link.url} placeholder="https://…" inputMode="url" onChange={(event) => update(index, { url: event.target.value })} />
          <select value={link.link_type} onChange={(event) => update(index, { link_type: event.target.value as ProjectLinkType })}>
            {LINK_TYPES.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
          </select>
          <button type="button" className="admin-button" onClick={() => onChange(links.filter((_, i) => i !== index))} aria-label="Remove">×</button>
        </div>
      ))}
      {error && <p role="alert" style={{ margin: 0, color: 'var(--color-seal)' }}>{error}</p>}
      <button type="button" className="admin-button" style={{ justifySelf: 'start' }} onClick={() => onChange([...links, { label: '', url: '', link_type: nextLinkType(links) }])}>Add link</button>
      <input type="hidden" name="links" value={JSON.stringify(links)} />
    </fieldset>
  );
}
