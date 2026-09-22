// The address part of a content item, and the one check a user-supplied link gets.

// Lowercase letters, digits and hyphens, at most 80 characters: what every published slug already is,
// and what the proxy accepts on a detail path before any page runs (REQ §5.3 rule 4, §5.4-d).
export const SLUG_PATTERN = /^[a-z0-9-]{1,80}$/;

// `new` is the editor's own address for creating an item; a slug of that name could never be edited.
const RESERVED_SLUGS = new Set(['new']);

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value) && !RESERVED_SLUGS.has(value);
}

// A link the site will render as a plain <a href>: http(s) only — no javascript:, data: or the like.
export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// An image the public pages can actually show: on this site, or in the Supabase storage of this project.
// next/image only optimises the configured host and the Content-Security-Policy only admits it, so any
// other origin would break the page that renders it.
export function isAllowedImageUrl(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabase) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === new URL(supabase).hostname;
  } catch {
    return false;
  }
}
