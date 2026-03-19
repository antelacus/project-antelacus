import 'server-only';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/server/database.types';
import { getSupabasePublicEnv } from './public-env';

export function createSupabasePublicServerClient() {
  const env = getSupabasePublicEnv();

  return createClient<Database>(env.url, env.publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
