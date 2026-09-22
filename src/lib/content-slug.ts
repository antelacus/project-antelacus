// The address part of a content item, and the one check a user-supplied link gets.

// Lowercase letters, digits and hyphens, at most 80 characters: what every published slug already is,
// and what the proxy accepts on a detail path before any page runs (REQ §5.3 rule 4, §5.4-d).
export const SLUG_PATTERN = /^[a-z0-9-]{1,80}$/;

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
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
