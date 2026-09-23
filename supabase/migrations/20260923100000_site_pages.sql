-- Standalone pages (only `about` so far), one row per page × language. Not in content_items: a page has
-- no date, tags, cover or type, and its slug repeats across languages by design. Which slugs and
-- languages exist is checked by the admin action (the language list lives in src/i18n/routing.ts).
create table if not exists public.site_pages (
  slug text not null,
  locale text not null,
  title text not null,
  body_markdown text not null,
  status public.content_status_enum not null default 'draft',
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (slug, locale)
);

drop trigger if exists set_site_pages_updated_at on public.site_pages;
create trigger set_site_pages_updated_at
before update on public.site_pages
for each row
execute function public.set_updated_at();

alter table public.site_pages enable row level security;

drop policy if exists "published pages readable" on public.site_pages;
create policy "published pages readable"
on public.site_pages
for select
to anon, authenticated
using (status = 'published');

-- Visitors read; only the service role (the admin, after its check) writes.
revoke all on public.site_pages from anon, authenticated;
grant select on public.site_pages to anon, authenticated;
grant select, insert, update, delete on public.site_pages to service_role;
