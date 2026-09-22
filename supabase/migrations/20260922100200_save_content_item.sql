-- One save = one transaction: the parent row and every relation (tags, gallery images, project links)
-- succeed or fail together. Called only through the service-role key from the admin's save action.
--
-- payload: the content_items columns (id optional; content_type, slug, title, body_markdown, locale,
-- status required; summary, published_at, cover_image_url, extra_metadata optional) plus
--   tags:   text[]                                          replaced wholesale
--   images: [{storage_path, public_url, alt_text, sort_order, captured_at}]   replaced wholesale
--   links:  [{label, url, link_type}]                                         replaced wholesale
-- With an id the row is updated by id (a changed slug is a changed address); without one the row is
-- matched on (content_type, locale, slug), so a second submit of a new item is an update.
-- published_at is written on the first publish only (an explicit value wins), never by a draft, and never
-- cleared by a later edit or retraction, so re-publishing keeps the original order.
-- A gallery cover that is not among the submitted images is dropped; the mapper falls back to the first.
create or replace function public.save_content_item(payload jsonb)
returns public.content_items
language plpgsql
as $$
declare
  existing public.content_items;
  item public.content_items;
  wanted_type public.content_type_enum := (payload->>'content_type')::public.content_type_enum;
  wanted_status public.content_status_enum := coalesce((payload->>'status')::public.content_status_enum, 'draft');
  requested_published_at timestamptz := nullif(payload->>'published_at', '')::timestamptz;
  cover text := nullif(payload->>'cover_image_url', '');
  images jsonb := case when jsonb_typeof(payload->'images') = 'array' then payload->'images' else '[]'::jsonb end;
  links jsonb := case when jsonb_typeof(payload->'links') = 'array' then payload->'links' else '[]'::jsonb end;
  tags jsonb := case when jsonb_typeof(payload->'tags') = 'array' then payload->'tags' else '[]'::jsonb end;
  tag_name text;
  tag_row_id uuid;
  entry jsonb;
  position integer := 0;
begin
  if wanted_type = 'gallery' and cover is not null and not exists (
    select 1 from jsonb_array_elements(images) img where img->>'public_url' = cover
  ) then
    cover := null;
  end if;

  if nullif(payload->>'id', '') is not null then
    -- Editing: the row is the one the editor opened, whatever its slug now is.
    select * into existing from public.content_items where id = (payload->>'id')::uuid;
    if existing.id is null then
      raise exception 'content item % not found', payload->>'id';
    end if;
    update public.content_items set
      content_type = wanted_type,
      slug = payload->>'slug',
      title = payload->>'title',
      summary = nullif(payload->>'summary', ''),
      body_markdown = payload->>'body_markdown',
      status = wanted_status,
      -- First publish sets the date (an explicit one wins); nothing later moves or clears it.
      published_at = case
        when wanted_status = 'published' then coalesce(existing.published_at, requested_published_at, timezone('utc', now()))
        else existing.published_at
      end,
      locale = payload->>'locale',
      cover_image_url = cover,
      seo_title = nullif(payload->>'seo_title', ''),
      seo_description = nullif(payload->>'seo_description', ''),
      -- Omitted metadata leaves the row's own alone; the caller sends a merged object when it means to change it.
      extra_metadata = coalesce(payload->'extra_metadata', existing.extra_metadata, '{}'::jsonb)
    where id = existing.id
    returning * into item;
  else
    -- New: one statement, so two first submissions of the same key cannot race into a duplicate —
    -- the second becomes the update the natural key promises.
    insert into public.content_items
      (content_type, slug, title, summary, body_markdown, status, published_at, locale, cover_image_url, seo_title, seo_description, extra_metadata)
    values
      (wanted_type, payload->>'slug', payload->>'title', nullif(payload->>'summary', ''), payload->>'body_markdown', wanted_status,
       case when wanted_status = 'published' then coalesce(requested_published_at, timezone('utc', now())) else null end,
       payload->>'locale', cover, nullif(payload->>'seo_title', ''), nullif(payload->>'seo_description', ''),
       coalesce(payload->'extra_metadata', '{}'::jsonb))
    on conflict (content_type, locale, slug) do update set
      title = excluded.title,
      summary = excluded.summary,
      body_markdown = excluded.body_markdown,
      status = excluded.status,
      published_at = case
        when excluded.status = 'published' then coalesce(content_items.published_at, requested_published_at, timezone('utc', now()))
        else content_items.published_at
      end,
      cover_image_url = excluded.cover_image_url,
      seo_title = excluded.seo_title,
      seo_description = excluded.seo_description,
      extra_metadata = coalesce(payload->'extra_metadata', content_items.extra_metadata, '{}'::jsonb)
    returning * into item;
  end if;

  delete from public.content_item_tags where content_item_id = item.id;
  for tag_name in select distinct trim(t) from jsonb_array_elements_text(tags) t where trim(t) <> '' loop
    insert into public.content_tags (name, slug) values (tag_name, lower(tag_name))
      on conflict (slug) do update set name = excluded.name
      returning id into tag_row_id;
    insert into public.content_item_tags (content_item_id, tag_id) values (item.id, tag_row_id)
      on conflict do nothing;
  end loop;

  delete from public.gallery_images where content_item_id = item.id;
  for entry in select * from jsonb_array_elements(images) loop
    position := position + 1;
    insert into public.gallery_images (content_item_id, storage_path, public_url, alt_text, sort_order, captured_at)
    values (item.id, entry->>'storage_path', entry->>'public_url', nullif(entry->>'alt_text', ''),
            coalesce((entry->>'sort_order')::integer, position), nullif(entry->>'captured_at', '')::timestamptz);
  end loop;

  delete from public.project_links where content_item_id = item.id;
  for entry in select * from jsonb_array_elements(links) loop
    insert into public.project_links (content_item_id, label, url, link_type)
    values (item.id, entry->>'label', entry->>'url', coalesce((entry->>'link_type')::public.project_link_type_enum, 'other'));
  end loop;

  return item;
end
$$;

revoke all on function public.save_content_item(jsonb) from public;
revoke all on function public.save_content_item(jsonb) from anon;
revoke all on function public.save_content_item(jsonb) from authenticated;
grant execute on function public.save_content_item(jsonb) to service_role;
