import test from 'node:test';
import assert from 'node:assert/strict';

// The release state transitions behind REQ release-pipeline §5.1 and §5.2 (DESIGN §5); the criteria
// themselves are in tests/acceptance-release-pipeline.test.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- plain .mjs module
const decide = (): Promise<any> => import('../scripts/release/decide.mjs');

const entry = (key: string, version = '2.5.0') => ({ key, imageId: `sha256:${key}`, sha: key, version });

test('a verified image is recorded once, newest first, ten at most', async () => {
  const { afterVerified } = await decide();
  let state = {};
  for (let i = 0; i < 12; i += 1) state = afterVerified({ state, key: `k${i}`, imageId: `i${i}` });
  state = afterVerified({ state, key: 'k5', imageId: 'i5' });
  const keys = (state as { verified: { key: string }[] }).verified.map((v) => v.key);
  assert.equal(keys.length, 10);
  assert.equal(keys[0], 'k5');
  assert.equal(new Set(keys).size, 10);
});

test('production may run only the image staging verified for that key', async () => {
  const { afterVerified, mayPromote } = await decide();
  const state = afterVerified({ state: {}, key: 'k1', imageId: 'sha256:a' });
  assert.equal(mayPromote({ state, key: 'k1', imageId: 'sha256:a' }), true);
  assert.equal(mayPromote({ state, key: 'k1', imageId: 'sha256:b' }), false, 'a rebuilt image with the same key was promoted');
  assert.equal(mayPromote({ state, key: 'k2', imageId: 'sha256:a' }), false);
  assert.equal(mayPromote({ state: {}, key: 'k1', imageId: 'sha256:a' }), false);
});

test('a production deploy becomes the newest kept image; five are kept', async () => {
  const { afterDeploy } = await decide();
  let state = {};
  for (const key of ['k1', 'k2', 'k3', 'k4', 'k5', 'k6']) state = afterDeploy({ state, env: 'production', entry: entry(key) });
  const s = state as { production: { key: string }; kept: { key: string }[] };
  assert.equal(s.production.key, 'k6');
  assert.deepEqual(s.kept.map((k) => k.key), ['k6', 'k5', 'k4', 'k3', 'k2']);
  const again = afterDeploy({ state, env: 'production', entry: entry('k4') }) as typeof s;
  assert.deepEqual(again.kept.map((k) => k.key), ['k4', 'k6', 'k5', 'k3', 'k2'], 'a redeploy duplicated a kept image');
});

test('a staging deploy touches only staging', async () => {
  const { afterDeploy } = await decide();
  const state = afterDeploy({ state: { production: entry('p'), kept: [entry('p')] }, env: 'staging', entry: entry('s') });
  assert.equal(state.staging.key, 's');
  assert.equal(state.production.key, 'p');
  assert.deepEqual(state.kept.map((k: { key: string }) => k.key), ['p'], 'a staging deploy moved the production rollback targets');
  assert.deepEqual(state.keptStaging.map((k: { key: string }) => k.key), ['s']);
});

test('pruning spares kept, verified, staging and production images', async () => {
  const { pruneImages } = await decide();
  const state = { production: entry('p'), kept: [entry('p'), entry('k')], staging: entry('s'), verified: [{ key: 'v', imageId: 'x' }] };
  const images = ['p', 'k', 's', 'v', 'old1', 'old2'].map((key) => ({ key, created: '2026-09-01T00:00:00.123456789Z' }));
  assert.deepEqual(pruneImages({ images, state, now: Date.parse('2026-10-01T00:00:00Z') }), ['old1', 'old2']);
});

test('pruning spares an image another run has just loaded and not yet deployed', async () => {
  const { pruneImages } = await decide();
  const now = Date.parse('2026-10-01T12:00:00Z');
  const images = [
    { key: 'fresh', created: '2026-10-01T07:00:00Z' }, // built five hours ago: its run may still deploy it
    { key: 'stale', created: '2026-10-01T05:00:00Z' },
    { key: 'undated', created: '' },
  ];
  assert.deepEqual(pruneImages({ images, state: {}, now }), ['stale']);
});

test('an env file reaches docker without the quotes, comments and export of dotenv', async () => {
  const { dockerEnv } = await decide();
  const text = [
    '# a comment',
    'NEXT_PUBLIC_SUPABASE_URL="https://x.supabase.co"',
    "KEY='single quoted'",
    'export PORT=3000',
    'BARE=value # trailing comment',
    'HASH="a#b"',
    '',
    'not a line',
  ].join('\n');
  assert.equal(dockerEnv(text), [
    'NEXT_PUBLIC_SUPABASE_URL=https://x.supabase.co',
    'KEY=single quoted',
    'PORT=3000',
    'BARE=value',
    'HASH=a#b',
  ].join('\n') + '\n');
});

test('a staging rollback touches only the staging targets', async () => {
  const { afterRollback } = await decide();
  const state = { production: entry('p'), kept: [entry('p')], staging: entry('b'), keptStaging: [entry('b'), entry('a')] };
  const after = afterRollback({ state, env: 'staging', target: entry('a') });
  assert.equal(after.staging.key, 'a');
  assert.deepEqual(after.keptStaging.map((k: { key: string }) => k.key), ['a']);
  assert.deepEqual(after.kept.map((k: { key: string }) => k.key), ['p']);
});

test('a rollback drops the image it rolled back from, so the next one cannot return to it', async () => {
  const { afterRollback } = await decide();
  const state = { production: entry('bad'), kept: [entry('bad'), entry('good'), entry('older')] };
  const after = afterRollback({ state, target: entry('good') });
  assert.equal(after.production.key, 'good');
  assert.deepEqual(after.kept.map((k: { key: string }) => k.key), ['good', 'older']);
});

test('an adopted image of unknown version is a rollback target only while no contract step exists', async () => {
  const { rollbackTarget } = await decide();
  const kept = [{ key: 'new', version: '2.5.0' }, { key: 'legacy', version: 'unknown' }];
  assert.equal(rollbackTarget({ kept, contracts: [] })?.key, 'legacy');
  assert.equal(rollbackTarget({ kept, contracts: [{ unusedSince: '2.5.0' }] }), null);
  assert.equal(rollbackTarget({ kept, contracts: [], requested: 'new' }), null, 'rolled back onto the image already running');
});

test('contract steps are read from the texts production ran, markers and all', async () => {
  const { contractSteps } = await import('../scripts/release/migration-lint.mjs');
  assert.deepEqual(contractSteps(['create table t (a int);', '-- contract: column c, unused since v2.6.0\nalter table t drop column c;']),
    [{ unusedSince: '2.6.0' }]);
  assert.deepEqual(contractSteps([]), []);
});

test('adopting production keeps what staging verified, so a PR waiting to merge can still be promoted', async () => {
  const { afterAdopt, mayPromote } = await decide();
  const state = { staging: entry('s'), keptStaging: [entry('s')], verified: [{ key: 's', imageId: 'sha256:s' }] };
  const adopted = afterAdopt({ state, entry: entry('legacy-x', 'unknown') });
  assert.equal(adopted.production.key, 'legacy-x');
  assert.deepEqual(adopted.kept.map((k: { key: string }) => k.key), ['legacy-x']);
  assert.equal(adopted.staging.key, 's', 'staging lost its record');
  assert.equal(mayPromote({ state: adopted, key: 's', imageId: 'sha256:s' }), true, 'the verified image was forgotten');
  assert.equal(afterAdopt({ state: {}, entry: entry('p') }).production.key, 'p');
});

test('the database password leaves the URL for a pgpass line, escaped as libpq reads it', async () => {
  const { pgConnection } = await decide();
  const env = 'SUPABASE_SERVICE_ROLE_KEY=x\nDATABASE_URL="postgresql://postgres.ref:p%40ss:w%5Cd@pooler.example.com:5432/postgres?sslmode=require"\n';
  const c = pgConnection(env);
  assert.equal(c.url, 'postgresql://postgres.ref@pooler.example.com:5432/postgres?sslmode=require');
  assert.equal(c.pgpass, '*:*:*:*:p@ss\\:w\\\\d\n');
  assert.doesNotMatch(c.url, /p%40ss/, 'the password is still in the URL');
  assert.equal(pgConnection('OTHER=1\n'), null);
});

test('release.sh puts no database URL with its password on a command line', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../scripts/release/release.sh', import.meta.url), 'utf8');
  const psql = source.split('\n').filter((line) => /\bpsql\b/.test(line) && !line.trim().startsWith('#'));
  assert.ok(psql.length > 0);
  for (const line of psql) assert.doesNotMatch(line, /DATABASE_URL|db_url/, line);
  assert.match(source, /PGPASSFILE=\/pgpass/);
});

test('the app container gets its own variables, not the server jobs\' (database password, ping URLs)', async () => {
  const { appEnv } = await decide();
  const text = [
    'NEXT_PUBLIC_SUPABASE_URL="https://x.supabase.co"',
    'SUPABASE_SERVICE_ROLE_KEY=role',
    'SITE_VERIFICATION_GOOGLE=g',
    'DATABASE_URL="postgresql://u:fake@db.example.com:5432/postgres"',
    'ANTELACUS_DATA_DIR=/data',
    'BACKUP_KEEP_DAYS=14',
    'PG_MAJOR=17',
    'HC_PING_BACKUP=https://hc-ping.com/abc',
    'HC_PING_SITE=https://hc-ping.com/def',
  ].join('\n');
  assert.equal(appEnv(text), 'NEXT_PUBLIC_SUPABASE_URL=https://x.supabase.co\nSUPABASE_SERVICE_ROLE_KEY=role\nSITE_VERIFICATION_GOOGLE=g\n');
  assert.equal(appEnv('DATABASE_URL=x\n'), '', 'only job variables: nothing for the app');
});

test('a password in the query string goes to pgpass too, and the last DATABASE_URL wins as in dotenv', async () => {
  const { pgConnection } = await decide();
  // Made-up values on example.com hosts: fixtures, not credentials.
  const inQuery = pgConnection('DATABASE_URL=postgresql://u@db.example.com:5432/db?sslmode=require&password=fake%3Avalue\n');
  assert.equal(inQuery.url, 'postgresql://u@db.example.com:5432/db?sslmode=require');
  assert.equal(inQuery.pgpass, '*:*:*:*:fake\\:value\n');
  const twice = pgConnection('DATABASE_URL=postgresql://u:fake-old@old.example.com/db\nDATABASE_URL=postgresql://u:fake-new@new.example.com/db\n');
  assert.equal(twice.url, 'postgresql://u@new.example.com/db');
  assert.equal(twice.pgpass, '*:*:*:*:fake-new\n');
});

test('a quoted value followed by a comment loses its quotes and the comment', async () => {
  const { dockerEnv } = await decide();
  assert.equal(dockerEnv('URL="https://x.supabase.co" # the project\nK=\'v\'  #c\nHASH="a#b"\n'), 'URL=https://x.supabase.co\nK=v\nHASH=a#b\n');
});

test('a DATABASE_URL that does not parse is reported without its text, so no log gets the password', async () => {
  const { pgConnection } = await decide();
  const value = 'postgresql://u:fake/pw@db.example.com/x';
  let caught: unknown;
  try {
    pgConnection(`DATABASE_URL=${value}\n`);
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof Error, 'no error for an unparsable URL');
  // Node prints an uncaught error's own properties: `input` would carry the whole URL.
  assert.doesNotMatch(`${caught.message} ${JSON.stringify(caught)} ${caught.stack}`, /fake\/pw|db\.example\.com/);
});

test('a comment that holds the same quote as the value does not become part of it', async () => {
  const { dockerEnv } = await decide();
  assert.equal(dockerEnv('URL="https://db.example.com/x" # the "session"\n'), 'URL=https://db.example.com/x\n');
});
