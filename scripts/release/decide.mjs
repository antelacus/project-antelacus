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

// Each environment keeps its last five images as rollback targets: production's are what a rollback may
// return to; staging's exist so a rollback can be rehearsed there with the same logic (REQ §5.6-a).
const KEPT = { production: 'kept', staging: 'keptStaging' };

/** The state after a deploy to an environment succeeded: it runs the entry, which heads its kept images. */
export function afterDeploy({ state, env, entry }) {
  const list = KEPT[env];
  const kept = [entry, ...(state[list] ?? []).filter((k) => k.key !== entry.key)];
  return { ...state, [env]: entry, [list]: retention({ production: kept.map((k) => k.key), staging: null }).keep.map((key) => kept.find((k) => k.key === key)) };
}

/** An environment's rollback targets, newest (the running image) first. */
export function keptOf({ state, env }) {
  return state[KEPT[env]] ?? [];
}

/** Whether production may run this image: staging verified exactly this image for this key. */
export function mayPromote({ state, key, imageId }) {
  return (state.verified ?? []).some((entry) => entry.key === key && entry.imageId === imageId);
}

/** Image tags to delete: everything but production's kept images, what staging runs, and recently verified images. */
export function pruneImages({ images, state }) {
  const protectedKeys = new Set([
    ...(state.kept ?? []).map((entry) => entry.key),
    ...(state.keptStaging ?? []).map((entry) => entry.key),
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

const semver = (v) => (/^\d+\.\d+\.\d+$/.test(v ?? '') ? v.split('.').map(Number) : null);
const older = (a, b) => { for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] < b[i]; return false; };

/** The tag a production release earns: only a version production did not already run. */
export function tagFor({ previous, next }) {
  return previous === next ? null : `v${next}`;
}

// Share images and public/images are the only things Cloudflare caches (DESIGN §8); a deploy that changes
// how they look purges them. Per-item share images live under their section, whose HTML is never cached.
const SHARE_IMAGE_PREFIXES = ['og.png', 'posts', 'notes', 'gallery', 'projects'].map((p) => `www.antelacus.com/${p}`);

/** Cloudflare prefixes to purge after a deploy that changed these files. */
export function purgeTargets(changedFiles) {
  const targets = new Set();
  for (const file of changedFiles) {
    if (/(^|\/)og\.png(\/|$)/.test(file) || file === 'src/lib/seo.ts') SHARE_IMAGE_PREFIXES.forEach((p) => targets.add(p));
    if (file.startsWith('public/images/')) targets.add('www.antelacus.com/images');
  }
  return [...targets];
}

/** What is wrong with Supabase Auth's public settings: sign-ups open, or email confirmation skipped. */
export function authSettingsProblems(settings) {
  const problems = [];
  if (settings.disable_signup !== true) problems.push('sign-ups are open: anyone can make an account');
  if (settings.mailer_autoconfirm !== false) problems.push('email confirmation is skipped');
  return problems;
}

/**
 * Where production may roll back to: the requested kept image, or the one before the current. Never an image
 * older than a contract step production has executed (its code would read what the database no longer has),
 * and never one whose version is unknown once any contract step exists.
 */
export function rollbackTarget({ kept, contracts, requested }) {
  const fits = (entry) => contracts.every(({ unusedSince }) => {
    const version = semver(entry.version);
    return version !== null && !older(version, semver(unusedSince));
  });
  if (requested) {
    const target = kept.find((entry) => entry.key === requested);
    return target && target !== kept[0] && fits(target) ? target : null;
  }
  // The newest kept image that still fits the database, not only the one before the current.
  return kept.slice(1).find(fits) ?? null;
}

/** The state after a rollback: the environment runs the target, and the image rolled back from is no longer kept. */
export function afterRollback({ state, env = 'production', target }) {
  const list = KEPT[env];
  const failed = state[env]?.key;
  return { ...state, [env]: target, [list]: (state[list] ?? []).filter((entry) => entry.key !== failed) };
}

/** The state after adopting a running production container: staging's records and every verified image stay. */
export function afterAdopt({ state, entry }) {
  return {
    ...state,
    production: entry,
    kept: [entry],
    verified: [{ key: entry.key, imageId: entry.imageId }, ...(state.verified ?? []).filter((v) => v.key !== entry.key)].slice(0, VERIFIED_KEPT),
  };
}

const DECISIONS = { afterAdopt, keptOf, tagFor, purgeTargets, authSettingsProblems, rollbackTarget, afterRollback, dockerEnv, checklistTicked, retention, stagingEnvProblems, migrationProblems, shouldDeploy, afterVerified, afterDeploy, mayPromote, pruneImages };

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
