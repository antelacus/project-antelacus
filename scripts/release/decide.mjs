// The release's decisions, kept pure so each is unit-tested (release-pipeline DESIGN §2.1): release.sh
// and the workflows only gather inputs, call these, and act on the answer.
//   node scripts/release/decide.mjs <decision> '<json input>'   — prints the answer as JSON
import { pathToFileURL } from 'node:url';

const KEEP = 5;

/** Which production images to keep (newest first, at most five) and which to delete; never the one staging runs. */
export function retention({ production, staging }) {
  const keep = production.slice(0, KEEP);
  const remove = production.slice(KEEP).filter((key) => key !== staging);
  return { keep, remove };
}

/** Variables that must not be in staging's env file: staging reads production and must never write it. */
export function stagingEnvProblems(envText) {
  const forbidden = ['SUPABASE_SERVICE_ROLE_KEY'];
  const names = envText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.replace(/^export\s+/, '').split('=')[0].trim());
  return forbidden.filter((name) => names.includes(name));
}

const migrationName = (file) => file.replace(/^\d+_/, '').replace(/\.sql$/, '');

/**
 * Migrations production has not executed as they are in the repository. A record is matched by name (its
 * version is the time it was applied); its stored text must hash to the file's, trailing newline stripped.
 */
export function migrationProblems({ files, records }) {
  const byName = new Map(records.map((record) => [record.name, record.digest]));
  const missing = [];
  const changed = [];
  for (const { file, digest } of files) {
    const recorded = byName.get(migrationName(file));
    if (recorded === undefined) missing.push(file);
    else if (recorded !== digest) changed.push(file);
  }
  return { missing, changed };
}

/** Whether a deploy changes anything: a docs-only merge has the key production already serves. */
export function shouldDeploy({ serving, next }) {
  return serving !== next;
}

const VERIFIED_KEPT = 10;

/** The state after staging verified an image: the newest first, one entry per key. */
export function afterVerified({ state, key, imageId }) {
  const verified = [{ key, imageId }, ...(state.verified ?? []).filter((entry) => entry.key !== key)].slice(0, VERIFIED_KEPT);
  return { ...state, verified };
}

/** The state after a deploy to an environment succeeded. Production also keeps it among its rollback targets. */
export function afterDeploy({ state, env, entry }) {
  if (env === 'staging') return { ...state, staging: entry };
  const kept = [entry, ...(state.kept ?? []).filter((kept) => kept.key !== entry.key)];
  return { ...state, production: entry, kept: retention({ production: kept.map((k) => k.key), staging: null }).keep.map((key) => kept.find((k) => k.key === key)) };
}

/** Whether production may run this image: staging verified exactly this image for this key. */
export function mayPromote({ state, key, imageId }) {
  return (state.verified ?? []).some((entry) => entry.key === key && entry.imageId === imageId);
}

/** Image tags to delete: everything but production's kept images, what staging runs, and recently verified images. */
export function pruneImages({ images, state }) {
  const protectedKeys = new Set([
    ...(state.kept ?? []).map((entry) => entry.key),
    ...(state.verified ?? []).map((entry) => entry.key),
    state.staging?.key,
    state.production?.key,
  ].filter(Boolean));
  return images.filter((key) => !protectedKeys.has(key));
}

/**
 * An env file as `docker run --env-file` needs it. Docker takes every character after `=` literally, while
 * the VPS files follow dotenv (quoted values, `export`, comments) — read as-is, a quoted URL is invalid.
 */
export function dockerEnv(text) {
  const lines = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2];
    const quoted = /^(['"])(.*)\1$/.exec(value);
    if (quoted) value = quoted[2];
    else value = value.replace(/\s+#.*$/, '');
    lines.push(`${match[1]}=${value}`);
  }
  return lines.length ? `${lines.join('\n')}\n` : '';
}

/** Whether a PR body ticks the signed-in look at staging (REQ §5.4-d): a checked box naming staging and the admin. */
export function checklistTicked(body) {
  return body.split('\n').some((line) => /^\s*[-*] \[[xX]\]/.test(line) && /staging/i.test(line) && /admin/i.test(line));
}

const DECISIONS = { dockerEnv, checklistTicked, retention, stagingEnvProblems, migrationProblems, shouldDeploy, afterVerified, afterDeploy, mayPromote, pruneImages };

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [name, input] = process.argv.slice(2);
  const decision = DECISIONS[name];
  if (!decision || input === undefined) {
    console.error(`usage: decide.mjs <${Object.keys(DECISIONS).join('|')}> '<json input>'`);
    process.exit(2);
  }
  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch {
    console.error('decide.mjs: the input is not JSON');
    process.exit(2);
  }
  process.stdout.write(`${JSON.stringify(decision(parsed))}\n`);
}
