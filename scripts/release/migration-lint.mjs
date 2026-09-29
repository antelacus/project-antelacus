// Migration discipline (REQ release-pipeline §5.7): migrations are additive; a destructive one carries a
// contract-step marker naming what it removes and the release since which nothing uses it. And a
// migration already on main is never edited: its text is what production executed.
//   node scripts/release/migration-lint.mjs [--base <ref>]   — lints supabase/migrations/; with --base,
//                                                              also refuses edits to files present on <ref>
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const MARKER = /^--\s*contract:\s*(.+?),\s*unused since v(\d+\.\d+\.\d+)\s*$/m;

// Only top-level statements count: a function body ($$ … $$) that deletes rows at call time is not a
// migration deleting data. Comments and literals are blanked so their words never match.
function topLevelStatements(sql) {
  const statements = [];
  let current = '';
  for (let i = 0; i < sql.length; ) {
    const rest = sql.slice(i);
    if (rest.startsWith('--')) {
      const end = sql.indexOf('\n', i);
      i = end === -1 ? sql.length : end;
      continue;
    }
    if (rest.startsWith('/*')) {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? sql.length : end + 2;
      current += ' ';
      continue;
    }
    const dollar = /^\$[A-Za-z_0-9]*\$/.exec(rest);
    if (dollar) {
      const end = sql.indexOf(dollar[0], i + dollar[0].length);
      i = end === -1 ? sql.length : end + dollar[0].length;
      current += ' $body$ ';
      continue;
    }
    if (sql[i] === "'" || sql[i] === '"') {
      const quote = sql[i];
      let j = i + 1;
      while (j < sql.length && !(sql[j] === quote && sql[j + 1] !== quote)) j += sql[j] === quote ? 2 : 1;
      i = j + 1;
      current += quote === "'" ? " '' " : ' "x" ';
      continue;
    }
    if (sql[i] === ';') {
      statements.push(current);
      current = '';
      i += 1;
      continue;
    }
    current += sql[i];
    i += 1;
  }
  statements.push(current);
  return statements.map((s) => s.replace(/\s+/g, ' ').trim().toLowerCase()).filter(Boolean);
}

const DESTRUCTIVE = [
  /^drop (table|schema|type|view|materialized view|sequence|domain)\b/,
  /^truncate\b/,
  /^delete from\b/,
  /^alter \S+( \S+)?\b.*\brename\b/,
  /^alter table\b.*\bdrop (column )?(if exists )?(?!constraint\b|default\b|not null\b|identity\b|expression\b)\S/,
  /^alter table\b.*\balter (column )?\S+ (set data )?type\b/,
];

/** The contract-step marker of a migration, or null. */
export function contractMarker(sql) {
  const match = MARKER.exec(sql);
  return match ? { what: match[1], unusedSince: match[2] } : null;
}

/** The contract steps among migration texts (a file's, or what production's records say it ran). */
export function contractSteps(texts) {
  return texts.map(contractMarker).filter(Boolean).map(({ unusedSince }) => ({ unusedSince }));
}

/** Problems with one migration's text; empty when it is additive or a marked contract step. */
export function lintMigration(sql) {
  const destructive = topLevelStatements(sql).filter((statement) => DESTRUCTIVE.some((rule) => rule.test(statement)));
  if (!destructive.length || contractMarker(sql)) return [];
  return destructive.map((statement) => `destructive statement without a contract-step marker: ${statement.slice(0, 80)}`);
}

/** Migration files already on main that a change modifies, renames or deletes. */
export function changedAppliedMigrations({ changed, onMain }) {
  const applied = new Set(onMain);
  return changed.filter(({ status, path }) => /^[MDRT]/.test(status) && applied.has(path)).map(({ path }) => path);
}

function main() {
  const dir = 'supabase/migrations';
  const baseIndex = process.argv.indexOf('--base');
  const base = baseIndex === -1 ? null : process.argv[baseIndex + 1];
  const files = readdirSync(dir).filter((file) => file.endsWith('.sql')).sort();
  const problems = [];
  let contracts = 0;
  for (const file of files) {
    const sql = readFileSync(join(dir, file), 'utf8');
    if (contractMarker(sql)) contracts += 1;
    for (const problem of lintMigration(sql)) problems.push(`${file}: ${problem}`);
  }
  if (base) {
    const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
    const onMain = git('ls-tree', '-r', '--name-only', base, '--', dir).split('\n').filter(Boolean);
    const changed = git('diff', '--name-status', `${base}...HEAD`, '--', dir)
      .split('\n').filter(Boolean)
      .map((line) => line.split('\t'))
      // A rename lists the old path second: that is the file production executed.
      .map(([status, path]) => ({ status, path }));
    for (const path of changedAppliedMigrations({ changed, onMain })) {
      problems.push(`${path}: already on ${base}, so production executed it as it was; write a new migration instead`);
    }
  }
  for (const problem of problems) console.error(`migration-lint: ${problem}`);
  console.log(`migration-lint: checked ${files.length} · contract steps ${contracts} · ${problems.length} problem(s)${base ? ` · edits checked against ${base}` : ''}`);
  process.exit(problems.length ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
