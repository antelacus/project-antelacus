# TECHNICAL_DEBT

## Purpose

This file tracks active technical debt, operational risks, and known limitations that are not yet resolved in the codebase.

Update this file when:

- a known risk is intentionally accepted
- a shortcut is taken to unblock delivery
- a missing workflow or safety net is identified
- a review finding is deferred instead of fixed immediately

## Active Items

### TD-027 - The proxy decides content 404s because a page's notFound() is never server-rendered

- Status: `Accepted` (a named stopgap) · Severity: `Low` · Area: `routing` · Identified: `2026-09-29` (v2.5.1, replacing TD-025)
- Context: Next's App Router answers a page's `notFound()` with a 404 whose HTML is an empty `<html id="__next_error__">` shell; the not-found page exists only in the script data and appears seconds later, or never without JavaScript (vercel/next.js #62228, open since 2024; #99287). So before any page under `[locale]` runs, `src/proxy.ts` looks the address up in `/api/route-index` and answers every unknown slug, tag and about page itself through `src/app/global-not-found.tsx`, which is server-rendered (routing-slimdown DESIGN §2.2, §9). The pages keep their `notFound()` as a backstop.
- Retire when: a Next upgrade renders a page's `notFound()` on the server — check with the minimal reproduction in #62228 (a page calling `notFound()`, `next build && next start`, the 404's HTML carries the not-found page without scripts). Then delete the lookup branch of `route-decision`, `routeIndex()` in the proxy, `/api/route-index` and invariant 10; keep the localized `global-not-found` (malformed addresses and unknown sections still need it).

### TD-028 - KaTeX is forced past the range its two Markdown plugins declare

- Status: `Accepted` (a named stopgap) · Severity: `Low` · Area: `dependencies` · Identified: `2026-10-12` (v2.5.2)
- Context: `rehype-katex` 7.0.1 and `micromark-extension-math` 3.1.0, the latest of each, declare `katex ^0.16`; KaTeX's advisory GHSA-238p-pmpm-9mq7 is fixed only in 0.19, and `npm audit fix` would instead downgrade both plugins by several majors. So `package.json` `overrides` pins `katex` to the project's own version. The acceptance tests that render a formula (`tests/acceptance-content-publishing.test.ts`) are what stand behind the pin.
- Retire when: both plugins declare a range that includes the project's KaTeX — then delete `overrides`.

### TD-029 - A high advisory on `braces` in the lint toolchain has no fixed release

- Status: `Accepted` · Severity: `Low` · Area: `dependencies` · Identified: `2026-10-12` (v2.5.2)
- Context: GHSA-vfj7-8cjw-p6xm covers every version of `braces`, reached only through `eslint-config-next` → `fast-glob` → `micromatch`. It is a development dependency: it never ships in the image, and the gate's `npm audit --omit=dev` does not see it. It runs only on this repository's own files and patterns.
- Retire when: `braces` publishes a fixed release — then `npm update` and delete this item.

## Findings of the 2026-09-21 scan

Scope of that scan: dependency audit and freshness, lint/types/tests/fresh build, secrets across all 103 commits, app security (auth, server actions, RLS migrations, content rendering, headers), code structure, infrastructure files, and read-only probes of the live site. Not covered: `globals.css`, line-by-line reads of the large components, the live Supabase project settings, in-browser behaviour, the VPS itself. The admin-notes exposure found by the same scan was fixed in v2.1.3 and is not listed.

Every finding of that scan is resolved; the scope note above still says what the scan did not examine.
