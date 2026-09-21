import 'server-only';

import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { getSupabaseAdminEmails, hasConfiguredAdminEmails } from './supabase-env';

export type AdminSession = {
  email: string;
  user: User;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!hasConfiguredAdminEmails()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  const email = normalizeEmail(user.email);
  const allowedEmails = getSupabaseAdminEmails();

  if (!allowedEmails.has(email)) {
    return null;
  }

  return {
    email,
    user,
  };
}

export async function requireAdminUser(nextPath: string = '/admin'): Promise<AdminSession> {
  const session = await getAdminSession();

  if (session) {
    return session;
  }

  const loginUrl = new URL('/admin/login', 'http://localhost');
  loginUrl.searchParams.set('next', nextPath);
  redirect(`${loginUrl.pathname}${loginUrl.search}`);
}

// The service-role client bypasses RLS, so it is handed out only here, after the
// admin check. A check in a layout does not protect a page: Next renders both in
// parallel and streams the page's data before the layout's redirect lands.
export async function getAdminServiceRoleClient(nextPath: string = '/admin') {
  await requireAdminUser(nextPath);
  return createSupabaseServiceRoleClient();
}
