# TECHNICAL_DEBT

## Purpose

This file tracks active technical debt, operational risks, and known limitations that are not yet resolved in the codebase.

Update this file when:

- a known risk is intentionally accepted
- a shortcut is taken to unblock delivery
- a missing workflow or safety net is identified
- a review finding is deferred instead of fixed immediately

## Active Items

## Findings of the 2026-09-21 scan

Scope of that scan: dependency audit and freshness, lint/types/tests/fresh build, secrets across all 103 commits, app security (auth, server actions, RLS migrations, content rendering, headers), code structure, infrastructure files, and read-only probes of the live site. Not covered: `globals.css`, line-by-line reads of the large components, the live Supabase project settings, in-browser behaviour, the VPS itself. The admin-notes exposure found by the same scan was fixed in v2.1.3 and is not listed.

v2.3.0 resolved every finding of that scan except the ones below; the scope note above still says what the scan did not examine.

### TD-020 - Three React hook rules run as warnings, not errors

- Status: `Open` · Severity: `Low` · Area: `lint` · Identified: `2026-09-22`
- Context: `eslint-config-next` 16 enables the React Compiler's `react-hooks/set-state-in-effect`, `immutability` and `static-components`. Eighteen existing sites fail them: state set inside effects in the four cards, `Nav`, `SearchModal`, `UtilityDropdown`; ref mutation in `PhotoViewer`; components defined inside `SearchModal`'s render. `eslint.config.mjs` downgrades the three rules to warnings so the gate stays meaningful.
- Retirement trigger: v2.4.0 rewrites these components for the visual upgrade; that version deletes the override and fixes whatever is left.
