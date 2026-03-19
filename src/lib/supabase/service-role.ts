import 'server-only';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/server/database.types';
import { getSupabaseServiceRoleEnv } from '@/lib/server/supabase-env';
import { getSupabasePublicEnv } from './public-env';

export function createSupabaseServiceRoleClient() {
  const publicEnv = getSupabasePublicEnv();
  const serverEnv = getSupabaseServiceRoleEnv();

  return createClient<Database>(publicEnv.url, serverEnv.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
