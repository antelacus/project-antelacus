// notFound() works by throwing; a try/catch around a lookup must let that particular throw through.
export function isNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'digest' in error && String((error as { digest?: unknown }).digest).startsWith('NEXT_HTTP_ERROR_FALLBACK;404');
}
