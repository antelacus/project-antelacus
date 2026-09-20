# Repository Guidelines

## Project Structure & Module Organization

This repository contains the `antelacus.com` blog, built with Next.js App Router and MDX content. Application routes live in `src/app/`, reusable UI in `src/components/`, and content loaders/helpers in `src/lib/`. Authoring content lives in `src/content/` with separate folders for `posts`, `notes`, `gallery`, `projects`, and pages. Localized messages are in `src/messages/`, shared styles in `src/styles/`, and static assets in `public/` (`public/images/`, `public/search-index/`). Deployment files live in `deploy/`, while versioned product docs belong under `docs/versions/`.

## Build, Test, and Development Commands

- `npm run dev` - start the local Next.js dev server with Turbopack.
- `npm run build` - create a production build; `postbuild` also regenerates tags/search data and validates content.
- `npm run start` - serve the production build locally.
- `npm run lint` - run the Next.js + TypeScript ESLint rules.
- `npm run validate:content` - run Zod-based frontmatter and registry checks before shipping content changes.
- `npm run seo:check` / `npm run seo:validate` - run SEO smoke checks for metadata and sitemap-related changes.

## Coding Style & Naming Conventions

Use TypeScript with `strict` mode and the `@/*` path alias from `tsconfig.json`. Follow the existing codebase style: React components in PascalCase (`PostCard.tsx`), utilities in camelCase (`tags.ts`), and scripts in kebab-case (`build-search-index.ts`). Prefer small, focused modules and keep shared types centralized instead of duplicating them. Run `npm run lint` before opening a PR.

## Testing Guidelines

There is no dedicated Jest/Vitest suite yet, so contributors should treat `npm run lint` and `npm run build` as the minimum verification gate. Content or taxonomy changes should also pass `npm run validate:content`. For search, SEO, or metadata updates, include the relevant script output and a quick manual smoke test of the affected route.

## Commit & Pull Request Guidelines

Match the repository history with Conventional Commit-style messages such as `feat(seo): add per-page OG routes` or `chore(v2.0.0): self-host antelacus on VPS`. Keep scopes meaningful (`seo`, `projects`, `v2.0.0`, `deps`). PRs should include: a short summary, linked issue or version doc when applicable, commands run for verification, and screenshots for visible UI/OG/image changes.

## Security & Configuration Tips

Copy `.env.example` when setting up local config, and never commit real secrets. Keep tokens server-side only, avoid storing secrets in browser storage, and prefer environment variables for deploy-specific settings used by Docker/nginx/VPS workflows.
