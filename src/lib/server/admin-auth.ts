import 'server-only';

import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role';
import { hasSupabaseServiceRoleEnv } from './supabase-env';

export type AdminSession = {
  email: string;
  user: User;
};

// What a save shows where the service-role key is absent (staging): the admin opens and reads, never writes.
export const READ_ONLY_MESSAGE = 'Read-only environment — not saved.';

export class ReadOnlyEnvironment extends Error {
  constructor() {
    super(READ_ONLY_MESSAGE);
    this.name = 'ReadOnlyEnvironment';
  }
}

// An admin is a user whose app_metadata.role is 'admin': only the service role can set app_metadata, and
// the RLS policies read the same claim (supabase/migrations/20260928100000_admin_read.sql). getUser() asks
// the Auth server, so a role set a moment ago counts here at once; RLS sees it after the next sign-in.
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email || user.app_metadata?.role !== 'admin') {
    return null;
  }

  return {
    email: user.email.trim().toLowerCase(),
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

// Reads: the admin's own session, so RLS decides what it sees (drafts included, for an admin).
export async function getAdminReadClient(nextPath: string = '/admin') {
  await requireAdminUser(nextPath);
  return createSupabaseServerClient();
}

// Writes only. The service-role client bypasses RLS, so it is handed out only here, after the admin
// check. A check in a layout does not protect a page: Next renders both in parallel and streams the
// page's data before the layout's redirect lands.
export async function getAdminServiceRoleClient(nextPath: string = '/admin') {
  await requireAdminUser(nextPath);
  if (!hasSupabaseServiceRoleEnv()) throw new ReadOnlyEnvironment();
  return createSupabaseServiceRoleClient();
}
