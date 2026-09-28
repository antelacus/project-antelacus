import { NextResponse } from 'next/server';

import { isValidSlug } from '@/lib/content-slug';
import { getAdminSession, ReadOnlyEnvironment } from '@/lib/server/admin-auth';
import { contentTypeSchema } from '@/lib/server/database.types';
import { UploadRejected, uploadImage } from '@/lib/server/media';

// A route handler rather than a server action: actions cap the request body at 1 MB, phone photos
// are several. The editor posts multipart/form-data with `file`, `type` and `slug`.
export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const type = contentTypeSchema.safeParse(form.get('type'));
  const slug = form.get('slug');

  if (!(file instanceof File) || !type.success || typeof slug !== 'string' || !isValidSlug(slug)) {
    return NextResponse.json({ error: 'Send a file, a content type and a valid slug' }, { status: 400 });
  }

  try {
    const uploaded = await uploadImage({ type: type.data, slug, file });
    return NextResponse.json(uploaded, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof UploadRejected) return NextResponse.json({ error: error.message }, { status: 422 });
    if (error instanceof ReadOnlyEnvironment) return NextResponse.json({ error: error.message }, { status: 503 });
    throw error;
  }
}
