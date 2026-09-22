import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import type { Database } from '@/lib/server/database.types';
import { getSupabasePublicEnv, hasSupabasePublicEnv } from './public-env';

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (!hasSupabasePublicEnv()) {
    return response;
  }

  const env = getSupabasePublicEnv();

  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    // No browser-side Supabase client exists, so the session never needs to be readable by script.
    cookieOptions: { httpOnly: true, secure: true, sameSite: 'lax' },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getClaims();

  return response;
}
