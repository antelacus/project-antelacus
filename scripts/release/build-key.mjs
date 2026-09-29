// The build input key: a hash of a directory's files (path, executable bit, content) plus the build
// arguments. Run by the Dockerfile's key stage over the context Docker copied in, so .dockerignore is
// applied by Docker itself and never re-implemented here.
//   node scripts/release/build-key.mjs <dir>      — prints the key; build arguments are the NEXT_PUBLIC_* env vars
import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync, readlinkSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

/** @param {{ root: string, buildArgs: Record<string, string> }} input */
export function buildKey({ root, buildArgs }) {
  const lines = files(root)
    .map((path) => {
      const stat = lstatSync(path);
      const name = relative(root, path).split(sep).join('/');
      const content = stat.isSymbolicLink() ? `link:${readlinkSync(path)}` : sha256(readFileSync(path));
      const exec = stat.mode & 0o111 ? 'x' : '-';
      return `${name}\0${exec}\0${content}`;
    })
    .sort();
  const args = Object.entries(buildArgs)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([name, value]) => `${name}=${value}`);
  return sha256([...lines, '\0args', ...args].join('\n'));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const root = process.argv[2];
  if (!root) {
    console.error('usage: build-key.mjs <dir>');
    process.exit(2);
  }
  const buildArgs = Object.fromEntries(Object.entries(process.env).filter(([name]) => name.startsWith('NEXT_PUBLIC_')));
  process.stdout.write(`${buildKey({ root, buildArgs })}\n`);
}
