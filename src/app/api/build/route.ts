import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { NextResponse } from 'next/server';

// The build input key of the running image (release-pipeline REQ §5.3-d, §5.5-b): the release checks
// compare it with the key they deployed. A file baked into the image, so no env file can override it;
// outside an image there is none and the answer is null.
export const dynamic = 'force-dynamic';

export async function GET() {
  let key: string | null = null;
  try {
    key = (await readFile(join(process.cwd(), 'BUILD_KEY'), 'utf8')).trim() || null;
  } catch {
    key = null;
  }
  return NextResponse.json({ key }, { status: key ? 200 : 404, headers: { 'Cache-Control': 'no-store' } });
}
