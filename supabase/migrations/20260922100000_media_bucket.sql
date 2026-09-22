-- The bucket every new image goes to (covers and inline images; albums keep using `gallery`).
-- Public read; writes come only through the service-role key, so no insert/update policy exists.
-- Guarded so the migration also applies to a plain Postgres without Supabase's storage schema
-- (the database-function check in scripts/db-function-check.sh runs there).
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('media', 'media', true)
    on conflict (id) do update set public = true;

    drop policy if exists "media public read" on storage.objects;
    create policy "media public read" on storage.objects
      for select using (bucket_id = 'media');
  end if;
end
$$;
