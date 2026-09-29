import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// release-pipeline DESIGN §7-5: production and staging run the same nginx. Both site files include the
// shared one; their HTTPS servers may differ only in the name, the upstream and staging's noindex.
const ROOT = join(import.meta.dirname, '..');
const read = (name: string) => readFileSync(join(ROOT, 'deploy/nginx', name), 'utf8');

function httpsServer(conf: string, host: string): string[] {
  const blocks = conf.split(/^server \{$/m).slice(1).map((b) => b.slice(0, b.lastIndexOf('}')));
  const block = blocks.find((b) => /listen 443 ssl;/.test(b) && new RegExp(`server_name ${host.replace('.', '\\.')};`).test(b));
  assert.ok(block, `no HTTPS server for ${host}`);
  return block.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

const ALLOWED = [/^server_name /, /^set \$antelacus_upstream /, /^add_header X-Robots-Tag /];

test('production and staging differ only in their name, upstream and noindex', () => {
  const strip = (lines: string[]) => lines.filter((l) => !ALLOWED.some((rule) => rule.test(l)));
  const www = httpsServer(read('www.antelacus.com.conf'), 'www.antelacus.com');
  const staging = httpsServer(read('staging.antelacus.com.conf'), 'staging.antelacus.com');
  assert.deepEqual(strip(staging), strip(www));
  assert.ok(www.includes('include /etc/nginx/snippets/antelacus-site.conf;'), 'production does not include the shared file');
  assert.ok(staging.some((l) => /^add_header X-Robots-Tag "noindex/.test(l)), 'staging may be indexed');
  assert.ok(!www.some((l) => /X-Robots-Tag/.test(l)), 'production says noindex');
  assert.match(www.join('\n'), /set \$antelacus_upstream http:\/\/127\.0\.0\.1:3002;/);
  assert.match(staging.join('\n'), /set \$antelacus_upstream http:\/\/127\.0\.0\.1:3003;/);
});

test('the shared file keeps the header buffer a signed-in admin needs', () => {
  assert.match(read('antelacus-site.conf'), /proxy_buffer_size 16k;/);
});
