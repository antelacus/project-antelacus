import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

// REQ docs/features/release-pipeline/REQ.md — the criteria a unit test can carry. Each is marked `todo`
// with its batch until that batch lands; the version cannot close with a mark left. Criteria that need a
// running staging or production site are in tests/runtime/release.runtime.mjs; those that need the
// seeded stack are in tests/ui/; the rest are Phase 4 evidence in the TRACK.

const ROOT = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const readIfAny = (path: string) => (existsSync(join(ROOT, path)) ? read(path) : '');

// Modules a later batch creates are imported by a runtime path so the type check stays green until then.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the module's types do not exist yet
const load = (path: string): Promise<any> => import(path);
const decide = () => load('../scripts/release/decide.mjs');

function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'build-key-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

// ---------- §5.1 无密钥的产物 ----------

test('acceptance §5.1-a no .env reaches the image', { todo: 'Batch 1' }, () => {
  const ignored = read('.dockerignore').split('\n').map((line) => line.trim());
  assert.ok(ignored.includes('.env*'), '.dockerignore does not exclude .env*');
  assert.doesNotMatch(read('Dockerfile'), /COPY[^\n]*\.env/, 'the Dockerfile copies an env file');
  // The image itself is checked where it is built: branch.yml plants a marked .env in the context and
  // asserts the built image holds neither the file nor the marker.
  assert.match(readIfAny('.github/workflows/branch.yml'), /PLANTED_ENV_MARKER/, 'the image job does not plant a marker');
});

test('acceptance §5.1-b the build input key changes with build inputs only', { todo: 'Batch 1' }, async () => {
  const { buildKey } = await load('../scripts/release/build-key.mjs');
  const base = { '.dockerignore': 'docs\n*.md\n', 'src/a.ts': 'a', 'docs/x.md': 'x', 'README.md': 'r' };
  const args = { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' };
  const key = buildKey({ root: tree(base), buildArgs: args });
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.equal(buildKey({ root: tree({ ...base, 'docs/x.md': 'changed', 'README.md': 'changed' }), buildArgs: args }), key,
    'a docs-only change moved the key');
  assert.notEqual(buildKey({ root: tree({ ...base, 'src/a.ts': 'b' }), buildArgs: args }), key, 'a source change kept the key');
  assert.notEqual(buildKey({ root: tree(base), buildArgs: { NEXT_PUBLIC_SUPABASE_URL: 'https://other.supabase.co' } }), key,
    'a build argument change kept the key');
});

test('acceptance §5.1-c no deploy path builds on the VPS', { todo: 'Batch 5' }, () => {
  for (const path of ['scripts/release/release.sh', '.github/workflows/production.yml']) {
    const source = read(path);
    assert.doesNotMatch(source, /docker build|compose[^\n]*--build|npm run build/, `${path} builds`);
  }
});

// ---------- §5.2 传输与保留 ----------

test('acceptance §5.2-a six production deploys keep the last five, never the image staging runs', { todo: 'Batch 4' }, async () => {
  const { retention } = await decide();
  const history = ['k6', 'k5', 'k4', 'k3', 'k2', 'k1']; // newest first
  const { keep, remove } = retention({ production: history, staging: 'k1' });
  assert.deepEqual(keep, ['k6', 'k5', 'k4', 'k3', 'k2']);
  assert.deepEqual(remove, [], 'k1 is removed while staging still runs it');
  assert.deepEqual(retention({ production: history, staging: 'k6' }).remove, ['k1']);
});

// ---------- §5.3 预发布站点 ----------

test('acceptance §5.3-c staging refuses an env file that holds the service-role key', { todo: 'Batch 4' }, async () => {
  const { stagingEnvProblems } = await decide();
  assert.deepEqual(stagingEnvProblems('NEXT_PUBLIC_SUPABASE_URL=https://x.supabase.co\n'), []);
  assert.deepEqual(stagingEnvProblems('A=1\nSUPABASE_SERVICE_ROLE_KEY=secret\n'), ['SUPABASE_SERVICE_ROLE_KEY']);
  assert.deepEqual(stagingEnvProblems('export SUPABASE_SERVICE_ROLE_KEY = secret\n'), ['SUPABASE_SERVICE_ROLE_KEY']);
  assert.deepEqual(stagingEnvProblems('# SUPABASE_SERVICE_ROLE_KEY=\n'), [], 'a comment is not a key');
});

// ---------- §5.4 预发布检查与合并条件 ----------

test('acceptance §5.4-c the PR template asks for the signed-in look at staging', { todo: 'Batch 5' }, () => {
  assert.match(read('.github/pull_request_template.md'), /- \[ \][^\n]*staging[^\n]*admin/i);
});

// ---------- §5.5 晋升与部署后核验 ----------

test('acceptance §5.5-a a push to main runs no gate and builds nothing', { todo: 'Batch 5' }, () => {
  const source = read('.github/workflows/production.yml');
  assert.match(source, /branches:\s*\[\s*main\s*\]/);
  assert.doesNotMatch(source, /npm run (build|lint|test)|npx tsc|ui-check|docker build|uses: \.\/\.github\/workflows\/branch\.yml/);
  assert.match(read('.github/workflows/branch.yml'), /branches-ignore:\s*\[\s*main\s*\]/);
});

test('acceptance §5.5-c a docs-only merge leaves the production container alone', { todo: 'Batch 5' }, async () => {
  const { shouldDeploy } = await decide();
  assert.equal(shouldDeploy({ serving: 'k1', next: 'k1' }), false);
  assert.equal(shouldDeploy({ serving: 'k1', next: 'k2' }), true);
  assert.equal(shouldDeploy({ serving: null, next: 'k2' }), true);
});

test('acceptance §5.5-d a tag only when the version changed', { todo: 'Batch 6' }, async () => {
  const { tagFor } = await decide();
  assert.equal(tagFor({ previous: '2.4.1', next: '2.5.0' }), 'v2.5.0');
  assert.equal(tagFor({ previous: '2.5.0', next: '2.5.0' }), null);
  assert.equal(tagFor({ previous: null, next: '2.5.0' }), 'v2.5.0');
});

test('acceptance §5.5-e the cache is purged only when a share image or public/images changed', { todo: 'Batch 6' }, async () => {
  const { purgeTargets } = await decide();
  assert.deepEqual(purgeTargets(['src/lib/posts.ts', 'docs/x.md']), []);
  assert.ok(purgeTargets(['public/images/avatar.jpg']).length > 0, 'public/images changed, nothing purged');
  assert.ok(purgeTargets(['public/og.png']).length > 0, 'the share image changed, nothing purged');
  assert.ok(purgeTargets(['src/app/og.png/route.tsx']).length > 0, 'the share image route changed, nothing purged');
});

test('acceptance §5.5-f open sign-ups or skipped confirmation turn the Auth check red', { todo: 'Batch 6' }, async () => {
  const { authSettingsProblems } = await decide();
  assert.deepEqual(authSettingsProblems({ disable_signup: true, mailer_autoconfirm: false }), []);
  assert.equal(authSettingsProblems({ disable_signup: false, mailer_autoconfirm: false }).length, 1);
  assert.equal(authSettingsProblems({ disable_signup: true, mailer_autoconfirm: true }).length, 1);
  assert.equal(authSettingsProblems({}).length, 2, 'a response without the fields passed');
});

// ---------- §5.7 迁移纪律 ----------

test('acceptance §5.7-a a destructive migration needs a contract-step marker', { todo: 'Batch 2' }, async () => {
  const { lintMigration } = await load('../scripts/release/migration-lint.mjs');
  assert.ok(lintMigration('alter table public.t drop column c;').length > 0, 'drop column passed');
  assert.ok(lintMigration('alter table public.t rename column a to b;').length > 0, 'rename passed');
  assert.ok(lintMigration('alter table public.t alter column c type bigint;').length > 0, 'a type change passed');
  assert.ok(lintMigration('truncate public.t;').length > 0, 'truncate passed');
  assert.deepEqual(lintMigration('-- contract: column c, unused since v2.5.0\nalter table public.t drop column c;'), []);
  assert.deepEqual(lintMigration('drop trigger if exists t on public.x;\ncreate trigger t before update on public.x for each row execute function f();'), [],
    're-creating a trigger is not destructive');
  const dir = join(ROOT, 'supabase/migrations');
  for (const file of readdirSync(dir)) assert.deepEqual(lintMigration(readFileSync(join(dir, file), 'utf8')), [], file);
});

test('acceptance §5.7-b a migration without an execution record stops the deploy, by name', { todo: 'Batch 4' }, async () => {
  const { missingMigrations } = await decide();
  const files = ['20260319073000_dynamic_content_foundation.sql', '20260923100000_site_pages.sql'];
  assert.deepEqual(missingMigrations(files, ['dynamic_content_foundation']), ['20260923100000_site_pages.sql']);
  assert.deepEqual(missingMigrations(files, ['dynamic_content_foundation', 'site_pages']), []);
});

test('acceptance §5.7-c migration names are unique, so records can match by name', { todo: 'Batch 2' }, () => {
  const names = readdirSync(join(ROOT, 'supabase/migrations')).map((file) => file.replace(/^\d+_/, '').replace(/\.sql$/, ''));
  assert.equal(new Set(names).size, names.length);
  // The records themselves (all seven in production) are Phase 4 evidence: list_migrations.
  assert.ok(names.length >= 8, 'the admin-read migration is not in the repository yet');
});

// ---------- §5.8 后台读取与管理员身份 ----------

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

test('acceptance §5.8-d the service-role client is reached only from write paths', { todo: 'Batch 3' }, () => {
  const users = sourceFiles(join(ROOT, 'src'))
    .filter((path) => /getAdminServiceRoleClient\(/.test(readFileSync(path, 'utf8')))
    .map((path) => relative(ROOT, path))
    .filter((path) => path !== 'src/lib/server/admin-auth.ts')
    .sort();
  assert.deepEqual(users, [
    'src/app/admin/(protected)/content/actions.ts',
    'src/app/admin/(protected)/pages/actions.ts',
    'src/lib/server/media.ts',
  ]);
  assert.doesNotMatch(read('src/lib/server/admin-auth.ts'), /SUPABASE_ADMIN_EMAILS|getSupabaseAdminEmails/, 'admins still come from the env');
});

// ---------- §5.9 闸门只跑一遍 ----------

test('acceptance §5.9-a the gate runs once per push, never for a PR', { todo: 'Batch 5' }, () => {
  const workflows = readdirSync(join(ROOT, '.github/workflows'));
  assert.ok(!workflows.includes('check.yml') && !workflows.includes('deploy.yml'), 'the old workflows are still there');
  const branch = read('.github/workflows/branch.yml');
  assert.match(branch, /on:\s*\n\s*push:/);
  assert.doesNotMatch(branch, /pull_request/);
});

test('acceptance §5.9-b the gate runs the database function check', { todo: 'Batch 5' }, () => {
  assert.match(read('.github/workflows/branch.yml'), /scripts\/db-function-check\.sh/);
});

test('acceptance §5.9-c both workflows write their step timings to the run summary', { todo: 'Batch 5' }, () => {
  for (const path of ['.github/workflows/branch.yml', '.github/workflows/production.yml']) {
    assert.match(read(path), /GITHUB_STEP_SUMMARY/, path);
  }
});
