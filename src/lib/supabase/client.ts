'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/server/database.types';
import { getSupabasePublicEnv } from './public-env';

export function createSupabaseBrowserClient() {
  const env = getSupabasePublicEnv();

  return createBrowserClient<Database>(env.url, env.publishableKey);
}
