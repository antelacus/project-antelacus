// Reads a workflow run's jobs (GitHub's `…/attempts/<n>/jobs` JSON on stdin) and prints a Markdown table
// of every job's and step's duration, for the run summary (release-pipeline REQ §5.9-c).
import { readFileSync } from 'node:fs';

const seconds = (from, to) => (from && to ? Math.round((Date.parse(to) - Date.parse(from)) / 1000) : null);
const cell = (value) => (value === null ? '—' : `${value}s`);

let jobs = [];
try {
  ({ jobs = [] } = JSON.parse(readFileSync(0, 'utf8')));
} catch {
  console.error('timings: the jobs are not JSON');
  process.exit(1);
}
const lines = ['| job / step | conclusion | duration |', '|---|---|---|'];
for (const job of jobs) {
  lines.push(`| **${job.name}** | ${job.conclusion ?? job.status} | ${cell(seconds(job.started_at, job.completed_at))} |`);
  for (const step of job.steps ?? []) {
    lines.push(`| &nbsp;&nbsp;${step.name.replaceAll('|', '\\|')} | ${step.conclusion ?? step.status} | ${cell(seconds(step.started_at, step.completed_at))} |`);
  }
}
console.log(`### Timings\n\n${lines.join('\n')}`);
