import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, matchesGlob, relative } from 'node:path';

// REQ docs/features/release-pipeline/REQ.md — the criteria a unit test can carry. Each is marked `todo`
// with its batch until that batch lands; the version cannot close with a mark left. Criteria that need a
// running staging or production site are in tests/runtime/release.runtime.mjs; those that need the
// seeded stack are in tests/ui/; the rest are Phase 4 evidence in the TRACK.

const ROOT = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

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

test('acceptance §5.1-a no .env reaches the image', () => {
  const ignored = read('.dockerignore').split('\n').map((line) => line.trim());
  assert.ok(ignored.includes('.env*'), '.dockerignore does not exclude .env*');
  assert.doesNotMatch(read('Dockerfile'), /COPY[^\n]*\.env/, 'the Dockerfile copies an env file');
  const args = [...read('Dockerfile').matchAll(/^ARG\s+([A-Z0-9_]+)/gm)].map((m) => m[1]);
  assert.ok(args.length > 0, 'no build arguments: the public values cannot reach the build');
  assert.deepEqual(args.filter((name) => !name.startsWith('NEXT_PUBLIC_')), [], 'a build argument that is not public');
  // The image itself is checked where it is built: image-check.sh plants a marked .env in the context and
  // asserts the built image holds neither the file nor the marker (wired into branch.yml: §5.9-b).
  assert.match(read('scripts/release/image-check.sh'), /PLANTED_ENV_MARKER/, 'the image check plants no marker');
});

test('acceptance §5.1-b the build input key changes with build inputs only', async () => {
  // Docker decides what is in the context (.dockerignore, applied by the key stage); the key is a hash
  // of exactly that directory plus the build arguments.
  const { buildKey } = await load('../scripts/release/build-key.mjs');
  const base = { 'src/a.ts': 'a', 'src/lib/b.ts': 'b', 'package.json': '{}' };
  const args = { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' };
  const key = buildKey({ root: tree(base), buildArgs: args });
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.equal(buildKey({ root: tree(base), buildArgs: args }), key, 'the same inputs gave another key');
  assert.notEqual(buildKey({ root: tree({ ...base, 'src/a.ts': 'changed' }), buildArgs: args }), key, 'a content change kept the key');
  assert.notEqual(buildKey({ root: tree({ 'src/renamed.ts': 'a', 'src/lib/b.ts': 'b', 'package.json': '{}' }), buildArgs: args }), key,
    'a rename kept the key');
  assert.notEqual(buildKey({ root: tree(base), buildArgs: { NEXT_PUBLIC_SUPABASE_URL: 'https://other.supabase.co' } }), key,
    'a build argument change kept the key');
  const ignored = read('.dockerignore').split('\n').map((line) => line.trim());
  for (const entry of ['docs', '*.md', '.github', 'tests']) assert.ok(ignored.includes(entry), `.dockerignore does not exclude ${entry}`);
  // The Dockerfile is a build input: excluded, a change to it alone would keep the key and never be built.
  const excluding = ignored.filter((p) => p && !p.startsWith('#') && !p.startsWith('!') && matchesGlob('Dockerfile', p));
  assert.deepEqual(excluding, [], '.dockerignore excludes the Dockerfile from the key');
  assert.match(read('Dockerfile'), /AS key\b/, 'no key stage');
});

test('acceptance §5.1-c no deploy path builds on the VPS', () => {
  for (const path of ['scripts/release/release.sh', '.github/workflows/production.yml']) {
    const source = read(path);
    // Only the key stage may run where production is decided: it copies the context and hashes it.
    const builds = source.split('\n').filter((line) => /docker build|compose[^\n]*--build|npm run build/.test(line) && !/--target key\b/.test(line));
    assert.deepEqual(builds, [], `${path} builds`);
  }
});

// ---------- §5.2 传输与保留 ----------

test('acceptance §5.2-a six production deploys keep the last five, never the image staging runs', async () => {
  const { afterDeploy, pruneImages } = await decide();
  let state: Record<string, unknown> = {};
  for (const key of ['k1', 'k2', 'k3', 'k4', 'k5', 'k6']) state = afterDeploy({ state, env: 'production', entry: { key, imageId: key } });
  assert.deepEqual((state.kept as { key: string }[]).map((k) => k.key), ['k6', 'k5', 'k4', 'k3', 'k2']);
  const now = Date.parse('2026-10-01T00:00:00Z');
  const images = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6'].map((key) => ({ key, created: '2026-09-01T00:00:00Z' }));
  assert.deepEqual(pruneImages({ images, state: { ...state, staging: { key: 'k1' } }, now }), [], 'k1 is removed while staging still runs it');
  assert.deepEqual(pruneImages({ images, state: { ...state, staging: { key: 'k6' } }, now }), ['k1']);
});

// ---------- §5.3 预发布站点 ----------

test('acceptance §5.3-c staging refuses an env file that holds the service-role key', async () => {
  const { stagingEnvProblems } = await decide();
  assert.deepEqual(stagingEnvProblems('NEXT_PUBLIC_SUPABASE_URL=https://x.supabase.co\n'), []);
  assert.deepEqual(stagingEnvProblems('A=1\nSUPABASE_SERVICE_ROLE_KEY=secret\n'), ['SUPABASE_SERVICE_ROLE_KEY']);
  assert.deepEqual(stagingEnvProblems('export SUPABASE_SERVICE_ROLE_KEY = secret\n'), ['SUPABASE_SERVICE_ROLE_KEY']);
  assert.deepEqual(stagingEnvProblems('# SUPABASE_SERVICE_ROLE_KEY=\n'), [], 'a comment is not a key');
});

// ---------- §5.4 预发布检查与合并条件 ----------

test('acceptance §5.4-c the PR template asks for the signed-in look at staging', () => {
  assert.match(read('.github/pull_request_template.md'), /- \[ \][^\n]*staging[^\n]*admin/i);
});

test('acceptance §5.4-d the PR check is red until the signed-in look is ticked', async () => {
  const { checklistTicked } = await decide();
  const template = read('.github/pull_request_template.md');
  assert.equal(checklistTicked(template), false, 'the untouched template passes');
  assert.equal(checklistTicked(template.replace(/- \[ \]([^\n]*staging[^\n]*admin)/i, '- [x]$1')), true);
  assert.equal(checklistTicked(''), false);
  assert.match(read('.github/workflows/pr-checklist.yml'), /pull_request/);
});

// ---------- §5.5 晋升与部署后核验 ----------

test('acceptance §5.5-a a push to main runs no gate and builds nothing', () => {
  const source = read('.github/workflows/production.yml');
  assert.match(source, /branches:\s*\[\s*main\s*\]/);
  assert.doesNotMatch(source, /npm run (build|lint|test)|npx tsc|ui-check|uses: \.\/\.github\/workflows\/branch\.yml/);
  // The key stage alone may run: it copies the context and hashes it.
  const builds = source.split('\n').filter((line) => /docker build/.test(line) && !/--target key\b/.test(line));
  assert.deepEqual(builds, [], 'production.yml builds the application');
  assert.match(read('.github/workflows/branch.yml'), /branches-ignore:\s*\[\s*main\s*\]/);
});

test('acceptance §5.5-c a docs-only merge leaves the production container alone', async () => {
  const { shouldDeploy } = await decide();
  assert.equal(shouldDeploy({ serving: 'k1', next: 'k1' }), false);
  assert.equal(shouldDeploy({ serving: 'k1', next: 'k2' }), true);
  assert.equal(shouldDeploy({ serving: null, next: 'k2' }), true);
});

test('acceptance §5.5-d a tag only when the version changed', async () => {
  const { tagFor } = await decide();
  assert.equal(tagFor({ previous: '2.4.1', next: '2.5.0' }), 'v2.5.0');
  assert.equal(tagFor({ previous: '2.5.0', next: '2.5.0' }), null);
  assert.equal(tagFor({ previous: null, next: '2.5.0' }), 'v2.5.0');
});

test('acceptance §5.5-e the cache is purged only when a share image or public/images changed', async () => {
  const { purgeTargets } = await decide();
  const shareImages = ['og.png', 'posts', 'notes', 'gallery', 'projects'].map((p) => `www.antelacus.com/${p}`).sort();
  assert.deepEqual(purgeTargets(['src/lib/posts.ts', 'docs/x.md', 'src/app/[locale]/page.tsx']), []);
  assert.deepEqual(purgeTargets(['public/images/avatar.jpg']), ['www.antelacus.com/images']);
  assert.deepEqual(purgeTargets(['public/og.png']).sort(), shareImages);
  assert.deepEqual(purgeTargets(['src/app/og.png/route.tsx']).sort(), shareImages);
  assert.deepEqual(purgeTargets(['src/app/posts/[slug]/og.png/route.tsx', 'public/images/x.png']).sort(), [...shareImages, 'www.antelacus.com/images'].sort());
});

test('acceptance §5.5-f open sign-ups or skipped confirmation turn the Auth check red', async () => {
  const { authSettingsProblems } = await decide();
  assert.deepEqual(authSettingsProblems({ disable_signup: true, mailer_autoconfirm: false }), []);
  assert.equal(authSettingsProblems({ disable_signup: false, mailer_autoconfirm: false }).length, 1);
  assert.equal(authSettingsProblems({ disable_signup: true, mailer_autoconfirm: true }).length, 1);
  assert.equal(authSettingsProblems({}).length, 2, 'a response without the fields passed');
});

// ---------- §5.6 回滚 ----------

test('acceptance §5.6-c after a contract migration, images older than its version are no rollback target', async () => {
  const { rollbackTarget } = await decide();
  const kept = [{ key: 'k3', version: '2.6.0' }, { key: 'k2', version: '2.5.1' }, { key: 'k1', version: '2.5.0' }];
  assert.equal(rollbackTarget({ kept, contracts: [] })?.key, 'k2');
  assert.equal(rollbackTarget({ kept, contracts: [{ unusedSince: '2.6.0' }] }), null, 'fell back to an image the database no longer fits');
  assert.equal(rollbackTarget({ kept, contracts: [{ unusedSince: '2.5.1' }] })?.key, 'k2');
  assert.equal(rollbackTarget({ kept, contracts: [{ unusedSince: '2.5.1' }], requested: 'k1' }), null, 'a manual rollback past a contract step went through');
  assert.equal(rollbackTarget({ kept: [kept[0]], contracts: [] }), null, 'nothing to fall back to, yet a target');
  // Past an incompatible one to the next that fits (versions need not be kept in order).
  const regressed = [{ key: 'now', version: '2.7.0' }, { key: 'old', version: '2.5.0' }, { key: 'mid', version: '2.6.0' }];
  assert.equal(rollbackTarget({ kept: regressed, contracts: [{ unusedSince: '2.6.0' }] })?.key, 'mid');
});

test('acceptance §5.6-a a failed verification rolls production back and stays red; staging does the same', () => {
  const production = read('.github/workflows/production.yml');
  // Not only a failed verification: a cancelled one leaves an unverified image in service just the same.
  assert.match(production, /^ {2}rollback:\n(?: {4}.*\n)*? {4}if: always\(\) && \(\(github\.event_name == 'push' && needs\.promote\.result == 'success' && needs\.verify\.result != 'success'\)/m);
  assert.match(production, /github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main'/, 'a manual rollback can run from any branch');
  assert.match(production, /release\.sh production rollback/);
  assert.match(production, /An automatic rollback leaves the run red[\s\S]*?exit 1/);
  assert.match(read('.github/workflows/branch.yml'), /release\.sh staging rollback/);
  // After a rollback only the build and a smoke check: main's runtime suite would fail the older image for its age.
  const rollbackJob = production.slice(production.indexOf('\n  rollback:'), production.indexOf('\n  tag:'));
  assert.doesNotMatch(rollbackJob, /acceptance\.runtime\.mjs/, 'the rollback runs main\'s runtime suite against an older image');
  // The rehearsal on staging itself is Phase 4 evidence (TRACK).
});

test('staging is deployed, checked and rolled back in one job, so no other deploy lands in between', () => {
  const branch = read('.github/workflows/branch.yml');
  const jobs = branch.split(/\n(?=  [a-z-]+:\n)/).filter((block) => /release\.sh staging (deploy|verified|rollback)/.test(block));
  assert.equal(jobs.length, 1, 'the staging deploy, its check and its rollback are split across jobs');
  assert.match(jobs[0], /^\s*staging-check:/);
});

// ---------- §5.7 迁移纪律 ----------

test('acceptance §5.7-a a destructive migration needs a contract-step marker', async () => {
  const { lintMigration } = await load('../scripts/release/migration-lint.mjs');
  assert.ok(lintMigration('alter table public.t drop column c;').length > 0, 'drop column passed');
  assert.ok(lintMigration('alter table public.t rename column a to b;').length > 0, 'rename passed');
  assert.ok(lintMigration('alter table public.t alter column c type bigint;').length > 0, 'a type change passed');
  assert.ok(lintMigration('truncate public.t;').length > 0, 'truncate passed');
  assert.deepEqual(lintMigration('-- contract: column c, unused since v2.5.0\nalter table public.t drop column c;'), []);
  assert.deepEqual(lintMigration('drop trigger if exists t on public.x;\ncreate trigger t before update on public.x for each row execute function f();'), [],
    're-creating a trigger is not destructive');
  assert.ok(lintMigration('drop table if exists public.t;').length > 0, 'drop table if exists passed');
  assert.ok(lintMigration('delete from public.t;').length > 0, 'a top-level delete passed');
  assert.deepEqual(lintMigration('create function f() returns void language plpgsql as $$ begin delete from public.t where id = 1; end $$;'), [],
    'a delete inside a function body is not a migration deleting data');
  const dir = join(ROOT, 'supabase/migrations');
  for (const file of readdirSync(dir)) assert.deepEqual(lintMigration(readFileSync(join(dir, file), 'utf8')), [], file);
});

test('acceptance §5.7-b a migration without a matching execution record stops the deploy', async () => {
  const { migrationProblems } = await decide();
  const files = [
    { file: '20260319073000_dynamic_content_foundation.sql', digest: 'a' },
    { file: '20260923100000_site_pages.sql', digest: 'b' },
  ];
  assert.deepEqual(migrationProblems({ files, records: [{ name: 'dynamic_content_foundation', digest: 'a' }] }),
    { missing: ['20260923100000_site_pages.sql'], changed: [] });
  assert.deepEqual(migrationProblems({ files, records: [{ name: 'dynamic_content_foundation', digest: 'a' }, { name: 'site_pages', digest: 'b' }] }),
    { missing: [], changed: [] });
  assert.deepEqual(migrationProblems({ files, records: [{ name: 'dynamic_content_foundation', digest: 'x' }, { name: 'site_pages', digest: 'b' }] }),
    { missing: [], changed: ['20260319073000_dynamic_content_foundation.sql'] }, 'a record whose text differs from the file passed');
});

test('acceptance §5.7-c migration names are unique, so records can match by name', () => {
  const names = readdirSync(join(ROOT, 'supabase/migrations')).map((file) => file.replace(/^\d+_/, '').replace(/\.sql$/, ''));
  assert.equal(new Set(names).size, names.length);
  // The records themselves (all of them in production) are Phase 4 evidence: list_migrations.
});

test('acceptance §5.7-d changing a migration that is already on main turns the gate red', async () => {
  const { changedAppliedMigrations } = await load('../scripts/release/migration-lint.mjs');
  const onMain = ['supabase/migrations/20260923100000_site_pages.sql'];
  assert.deepEqual(changedAppliedMigrations({ changed: [{ status: 'A', path: 'supabase/migrations/20261001000000_new.sql' }], onMain }), []);
  assert.deepEqual(changedAppliedMigrations({ changed: [{ status: 'M', path: onMain[0] }], onMain }), [onMain[0]]);
  assert.deepEqual(changedAppliedMigrations({ changed: [{ status: 'D', path: onMain[0] }], onMain }), [onMain[0]]);
  assert.deepEqual(changedAppliedMigrations({ changed: [{ status: 'M', path: 'src/lib/posts.ts' }], onMain }), []);
});

test('acceptance §5.7-e the backup puts neither the database password nor the service-role key on a command line', () => {
  const backup = read('scripts/backup.sh');
  // pg_dump gets a URL without the password and a pgpass file; nothing hands it DATABASE_URL itself.
  const dockerLines = backup.split('\n').filter((line) => /docker run|pg_dump|psql/.test(line) && !line.trim().startsWith('#'));
  for (const line of dockerLines) assert.doesNotMatch(line, /DATABASE_URL/, line);
  assert.match(backup, /PGPASSFILE=/);
  // The storage mirror reads the key from a mounted file: an -e or --env-file variable shows in docker inspect.
  assert.doesNotMatch(backup, /-e SUPABASE_SERVICE_ROLE_KEY\b|--env-file/);
  assert.match(backup, /SUPABASE_SERVICE_ROLE_KEY_FILE=/);
  assert.match(read('scripts/sync-bucket.mjs'), /SUPABASE_SERVICE_ROLE_KEY_FILE/);
  // The real run (ps and docker inspect sampled while it works) is Phase 4 evidence in the TRACK.
});

// ---------- §5.8 后台读取与管理员身份 ----------

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

test('acceptance §5.8-d the service-role client is reached only from write paths', () => {
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

test('acceptance §5.9-a the gate runs once per push, never for a PR', () => {
  const workflows = readdirSync(join(ROOT, '.github/workflows'));
  assert.ok(!workflows.includes('check.yml') && !workflows.includes('deploy.yml'), 'the old workflows are still there');
  const branch = read('.github/workflows/branch.yml');
  assert.match(branch, /on:\s*\n\s*push:/);
  assert.doesNotMatch(branch, /pull_request/);
});

test('acceptance §5.9-b the gate runs the database function check and checks its image', () => {
  const branch = read('.github/workflows/branch.yml');
  assert.match(branch, /scripts\/db-function-check\.sh/);
  assert.match(branch, /image-check\.sh plant[\s\S]*docker build[\s\S]*image-check\.sh verify/, 'the image job does not check its image');
});

test('acceptance §5.9-c both workflows write every job\'s and step\'s duration to the run summary', async () => {
  for (const path of ['.github/workflows/branch.yml', '.github/workflows/production.yml']) {
    assert.match(read(path), /\| node scripts\/release\/timings\.mjs >> "\$GITHUB_STEP_SUMMARY"/, path);
  }
  // …and the formatter lists each job and each step with its seconds.
  const { spawnSync } = await import('node:child_process');
  const jobs = { jobs: [{ name: 'ui', conclusion: 'success', started_at: '2026-09-29T00:00:00Z', completed_at: '2026-09-29T00:06:30Z',
    steps: [{ name: 'Run scripts/ui-check.sh', conclusion: 'success', started_at: '2026-09-29T00:01:00Z', completed_at: '2026-09-29T00:06:00Z' }] }] };
  const out = spawnSync('node', ['scripts/release/timings.mjs'], { cwd: ROOT, input: JSON.stringify(jobs), encoding: 'utf8' }).stdout;
  assert.match(out, /\| \*\*ui\*\* \| success \| 390s \|/);
  assert.match(out, /Run scripts\/ui-check\.sh \| success \| 300s \|/);
});

test('acceptance §5.3-b the staging checks run as staging, the production ones as production', () => {
  // release.runtime.mjs skips its staging-only checks unless told it is on staging.
  assert.match(read('.github/workflows/branch.yml'), /RELEASE_ENV=staging [^\n]*tests\/runtime\/release\.runtime\.mjs/);
  assert.match(read('.github/workflows/production.yml'), /RELEASE_ENV=production [^\n]*tests\/runtime\/release\.runtime\.mjs/);
});
