'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getSafeNextPath } from '@/lib/safe-next-path';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  next: z.string().optional(),
});

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  });

  const nextPath = getSafeNextPath(formData.get('next'), '/admin', '/admin');

  if (!parsed.success) {
    redirect(`/admin/login?error=validation&next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect(`/admin/login?error=credentials&next=${encodeURIComponent(nextPath)}`);
  }

  revalidatePath('/admin', 'layout');
  redirect(nextPath);
}
