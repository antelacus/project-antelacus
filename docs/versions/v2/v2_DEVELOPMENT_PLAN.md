# v2 Development Plan

## Document Status

- Major version: `v2`
- Status: Active working plan
- Date: `2026-03-27`
- Owner: `project-antelacus`

## 1. v2 Theme

`v2` is the transition from a stable self-hosted personal site into a site with real content infrastructure that remains self-hostable.

The main idea is:

- keep the public visual identity and URL structure stable
- move publishing away from repository-managed files
- add an authenticated admin workflow
- make content updates faster, safer, and more operationally sustainable
- keep the long-term source of truth on the VPS instead of depending on a managed external backend for core content

In short, `v2` is about turning AnteLacus from a static-file publishing workflow into a maintainable content platform without rebuilding the site’s outward identity or giving up infrastructure ownership.

## 2. Success Criteria

`v2` is successful when:

- content is managed primarily through self-hosted workflows backed by SQLite on the VPS
- posts, notes, projects, and gallery entries can be published without code deploys
- search, tags, sitemap, and metadata stay correct after content changes
- admin publishing is protected and secrets remain server-side
- backup and recovery are simple enough for a low-traffic personal site
- operational risk is lower than both the original file-based flow and the Supabase-dependent phase

## 3. Out of Scope for v2

These are explicitly not required for `v2` as a whole:

- major visual redesign of the public site
- multi-author newsroom/editor roles
- rich block editor / Notion-style publishing UX
- comments or public user accounts
- migration away from VPS hosting
- adopting another managed backend as the long-term source of truth for core content

## 4. Planned Minor Versions

### v2.0.0 - VPS Self-Hosting Foundation

- Status: Released
- Purpose: move the site onto the VPS/Docker/nginx/Cloudflare stack and stabilize hosting
- Notes:
  - production hosting is in place
  - this is the baseline that later `v2.*` work builds on

### v2.1.0 - Dynamic Content Foundation (Supabase Phase)

- Status: Implemented, no longer the target end-state
- Purpose: prove the dynamic content model and admin workflow against a hosted backend
- Primary scope:
  - Supabase schema, auth, storage foundation
  - admin note publishing flow
  - runtime cutover for posts, notes, projects, gallery
  - dynamic tags, search, and sitemap
  - legacy import and parity verification
- Notes:
  - `v2.1.0` validated that dynamic content, admin publishing, and runtime-derived metadata work for AnteLacus
  - however, Supabase free-tier pause behavior makes it a poor long-term fit for a low-traffic personal blog
  - the new plan is to preserve the dynamic-content architecture while repatriating the source of truth back onto the VPS
- Working docs:
  - `docs/versions/v2/dynamic-content/PHASE1_REQ.md`
  - `docs/versions/v2/dynamic-content/PHASE2_DESIGN.md`
  - `docs/versions/v2/dynamic-content/PHASE3-5_TRACK.md`

### ~~v2.2.0 - Self-Hosted SQLite Replatform~~ (Cancelled)

- Status: Cancelled (2026-04-12)
- Reason: Decided to stay on Supabase free tier. The core issue (project pausing due to inactivity) was resolved with a hardened daily keepalive cron instead of a full replatform. The REQ was drafted but removed — regenerate if Supabase becomes untenable again.

### v2.3.0 - Editorial Operations Polish

- Status: Skeleton
- Purpose: improve day-to-day publishing ergonomics after the SQLite cutover
- Likely scope:
  - admin CRUD for posts, projects, and gallery
  - publish/update/delete revalidation coverage for all content types
  - editorial safeguards and validation improvements
  - export tooling and operator-friendly recovery steps
- Open questions:
  - whether to add a richer markdown editing experience
  - whether gallery ordering/editing should be admin-managed here

### v2.4.0 - Search, SEO, and Operational Hardening

- Status: Skeleton
- Purpose: harden the self-hosted dynamic system for production durability and discoverability
- Likely scope:
  - improved search behavior/performance
  - SEO and metadata audits after the SQLite cutover
  - monitoring and failure handling for local content services
  - cache and revalidation strategy review
  - backup verification and restore drills
- Open questions:
  - how much resilience to add around local DB corruption, disk failure, or bad deploys
  - whether to add content health dashboards/checks

### v2.5.0 - Remaining Content and Localization Decisions

- Status: Skeleton
- Purpose: clean up remaining special cases outside the first migration wave
- Likely scope:
  - evaluate whether `/about` should remain file-based or move into SQLite
  - revisit multilingual content strategy versus route-only localization
  - document the long-term source-of-truth model for all site content
- Open questions:
  - whether `/about` should stay as a localized file-based exception long term
  - whether future content types need true per-locale bodies

## 5. Dependency Order

The recommended execution order inside `v2` is:

1. `v2.0.0` hosting baseline
2. `v2.1.0` dynamic content foundation and proof-of-concept phase
3. ~~`v2.2.0` SQLite replatform~~ (cancelled)
4. `v2.3.0` editorial/admin workflow completion
5. `v2.4.0` hardening and operational polish
6. `v2.5.0` remaining content/localization cleanup

## 6. Current Priority

The active focus is `v2.3.0`.

`v2.1.0` established Supabase as the dynamic content backend. The planned SQLite replatform (`v2.2.0`) was cancelled after hardening the Supabase keepalive — the free tier remains viable with a daily ping. The next milestone is completing editorial workflows for all content types.

## 7. Planning Notes

- This plan is intentionally lightweight for minors after `v2.3.0`
- Future `v2.*` items should be refined only when they become active work
- If priorities shift, this document should be updated before starting the next minor version
- Supabase is the current long-term content platform; if free-tier viability changes, revisit the replatform decision
