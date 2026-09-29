import 'server-only';

import { z } from 'zod';

const serverSupabaseEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

type ServerSupabaseEnv = {
  serviceRoleKey: string;
};

function formatEnvError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(' ');
}

export function hasSupabaseServiceRoleEnv(): boolean {
  return serverSupabaseEnvSchema.safeParse(process.env).success;
}

export function getSupabaseServiceRoleEnv(): ServerSupabaseEnv {
  const parsed = serverSupabaseEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Supabase server environment is misconfigured. ${formatEnvError(parsed.error)}`);
  }

  return {
    serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  };
}
