create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create index if not exists content_item_tags_tag_id_idx
  on public.content_item_tags (tag_id);
