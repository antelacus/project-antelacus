# v2 Development Plan

## Document Status

- Major version: `v2`
- Status: Active working plan
- Date: `2026-03-19`
- Owner: `project-antelacus`

## 1. v2 Theme

`v2` is the transition from a stable self-hosted personal site into a site with real content infrastructure.

The main idea is:

- keep the public visual identity and URL structure stable
- move publishing away from repository-managed files
- add an authenticated admin workflow
- make content updates faster, safer, and more operationally sustainable

In short, `v2` is about turning AnteLacus from a static-file publishing workflow into a maintainable content platform without rebuilding the site’s outward identity.

## 2. Success Criteria

`v2` is successful when:

- content is managed primarily through Supabase-backed workflows
- posts, notes, projects, and gallery entries can be published without code deploys
- search, tags, sitemap, and metadata stay correct after content changes
- admin publishing is protected and secrets remain server-side
- operational risk is lower than the original file-based flow

## 3. Out of Scope for v2

These are explicitly not required for `v2` as a whole:

- major visual redesign of the public site
- multi-author newsroom/editor roles
- rich block editor / Notion-style publishing UX
- comments or public user accounts
- migration away from VPS hosting

## 4. Planned Minor Versions

### v2.0.0 - VPS Self-Hosting Foundation

- Status: Released
- Purpose: move the site onto the VPS/Docker/nginx/Cloudflare stack and stabilize hosting
- Notes:
  - production hosting is in place
  - this is the baseline that later `v2.*` work builds on

### v2.1.0 - Dynamic Content

- Status: In progress
- Purpose: migrate core content domains from file-based runtime reads to Supabase-backed publishing
- Primary scope:
  - Supabase schema, auth, storage foundation
  - admin note publishing flow
  - runtime cutover for posts, notes, projects, gallery
  - dynamic tags, search, and sitemap
  - legacy import and parity verification
- Working docs:
  - `docs/versions/v2/dynamic-content/PHASE1_REQ.md`
  - `docs/versions/v2/dynamic-content/PHASE2_DESIGN.md`
  - `docs/versions/v2/dynamic-content/PHASE3-5_TRACK.md`

### v2.2.0 - Editorial Operations Polish

- Status: Skeleton
- Purpose: improve day-to-day publishing ergonomics after the core Supabase migration
- Likely scope:
  - admin CRUD for posts, projects, and gallery
  - publish/update/delete revalidation coverage for all content types
  - editorial safeguards and validation improvements
  - backup/export or operational recovery tooling
- Open questions:
  - whether to add a richer markdown editing experience
  - whether gallery ordering/editing should be admin-managed here

### v2.3.0 - Search, SEO, and Operational Hardening

- Status: Skeleton
- Purpose: harden the new dynamic system for production durability and discoverability
- Likely scope:
  - improved search behavior/performance
  - SEO and metadata audits after dynamic cutover
  - monitoring and failure handling for content services
  - cache and revalidation strategy review
- Open questions:
  - how much resilience to add around Supabase outages
  - whether to add content health dashboards/checks

### v2.4.0 - Remaining Content and Localization Decisions

- Status: Skeleton
- Purpose: clean up remaining special cases outside the first migration wave
- Likely scope:
  - evaluate whether `/about` should remain file-based or move into Supabase
  - revisit multilingual content strategy versus route-only localization
  - document the long-term source-of-truth model for all site content
- Open questions:
  - whether `/about` should stay as a localized file-based exception long term
  - whether future content types need true per-locale bodies

## 5. Dependency Order

The recommended execution order inside `v2` is:

1. `v2.0.0` hosting baseline
2. `v2.1.0` dynamic content migration
3. `v2.2.0` editorial/admin workflow completion
4. `v2.3.0` hardening and operational polish
5. `v2.4.0` remaining content/localization cleanup

## 6. Current Priority

The active focus remains `v2.1.0`.

Until `v2.1.0` is fully reviewed and released, later `v2.*` entries should be treated as placeholders rather than committed scope.

## 7. Planning Notes

- This plan is intentionally lightweight for minors after `v2.1.0`
- Future `v2.*` items should be refined only when they become active work
- If priorities shift, this document should be updated before starting the next minor version
