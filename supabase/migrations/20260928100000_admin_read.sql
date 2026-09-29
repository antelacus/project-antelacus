-- The admin reads through its own session, not the service-role key (REQ release-pipeline §5.8): a signed-in
-- user whose app_metadata.role is 'admin' reads every row, drafts included; everyone else keeps the published
-- policies. Writes still go only through the service role. app_metadata is writable by the service role alone,
-- so a user cannot make themselves admin; the claim reaches the JWT at the next sign-in or token refresh.
-- Reads the claims PostgREST sets rather than auth.jwt(), so this also runs on the plain Postgres of
-- scripts/db-function-check.sh; on Supabase the two are the same value.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role') = 'admin',
    false
  )
$$;

grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Supabase grants these by default; spelled out so the policies below also hold on a plain Postgres.
grant select on public.content_items, public.content_tags, public.content_item_tags,
  public.gallery_images, public.project_links, public.site_pages to anon, authenticated;

drop policy if exists "admins read all content" on public.content_items;
create policy "admins read all content" on public.content_items for select to authenticated using (public.is_admin());

drop policy if exists "admins read all tags" on public.content_tags;
create policy "admins read all tags" on public.content_tags for select to authenticated using (public.is_admin());

drop policy if exists "admins read all tag links" on public.content_item_tags;
create policy "admins read all tag links" on public.content_item_tags for select to authenticated using (public.is_admin());

drop policy if exists "admins read all gallery images" on public.gallery_images;
create policy "admins read all gallery images" on public.gallery_images for select to authenticated using (public.is_admin());

drop policy if exists "admins read all project links" on public.project_links;
create policy "admins read all project links" on public.project_links for select to authenticated using (public.is_admin());

drop policy if exists "admins read all pages" on public.site_pages;
create policy "admins read all pages" on public.site_pages for select to authenticated using (public.is_admin());
