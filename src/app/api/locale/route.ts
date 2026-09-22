import { NextResponse } from 'next/server';

import { isSupportedLocale, PREFERRED_LOCALE_COOKIE } from '@/i18n/routing';
import { getSafeNextPath } from '@/lib/safe-next-path';

// The language switch links here. The cookie is written by the server because a cookie written by
// page script lives at most seven days on Safari; a server-set one keeps its year.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const to = url.searchParams.get('to');
  if (!isSupportedLocale(to)) {
    return NextResponse.json({ error: 'unknown locale' }, { status: 400, headers: { 'Cache-Control': 'private, no-store' } });
  }

  const next = getSafeNextPath(url.searchParams.get('next'), `/${to}`);
  const response = NextResponse.redirect(new URL(next, url.origin), 303);
  response.cookies.set(PREFERRED_LOCALE_COOKIE, to, { path: '/', maxAge: 31536000, sameSite: 'lax', secure: true, httpOnly: true });
  // Personal to this visitor: never replayed from any cache.
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
