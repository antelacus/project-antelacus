import { z } from 'zod';

const publicSupabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
}).superRefine((value, ctx) => {
  if (!value.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !value.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      path: ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
    });
  }
});

type PublicSupabaseEnv = {
  url: string;
  publishableKey: string;
};

function formatEnvError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(' ');
}

export function hasSupabasePublicEnv(): boolean {
  return publicSupabaseEnvSchema.safeParse(process.env).success;
}

export function getSupabasePublicEnv(): PublicSupabaseEnv {
  const parsed = publicSupabaseEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Supabase public environment is misconfigured. ${formatEnvError(parsed.error)}`);
  }

  return {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}
