import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  revalidatePath('/admin', 'layout');
  return NextResponse.redirect(new URL('/admin/login', request.url), {
    status: 302,
  });
}
