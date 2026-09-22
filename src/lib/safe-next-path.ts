// Where to send someone after an action, taken from a query string they could have typed themselves.
// Only a path on this site is accepted — never another origin, a protocol-relative address or a
// header-splitting character — and, when `within` is given, only that section (compared by segment,
// so `/administrator` is not inside `/admin`).
export function getSafeNextPath(next: unknown, fallback: string, within?: string): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return fallback;
  if (next.includes('://') || /[\\\r\n]/.test(next)) return fallback;
  if (within && next !== within && !next.startsWith(`${within}/`) && !next.startsWith(`${within}?`)) return fallback;
  return next;
}
