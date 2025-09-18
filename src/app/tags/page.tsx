import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { detectFromRequestHeaders } from '@/i18n/detect';

export default async function TagsRedirectShell() {
  const hdrs = await headers();
  const detected = detectFromRequestHeaders(hdrs);
  redirect(`/${detected}/tags`);
}


