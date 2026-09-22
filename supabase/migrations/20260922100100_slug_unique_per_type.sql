-- A slug identifies one item of a type regardless of the language it is written in: public pages look
-- up by (type, slug) alone, so two rows differing only in locale would make that lookup ambiguous.
-- The existing (type, locale, slug) constraint stays as the natural key the save function upserts on.
create unique index if not exists content_items_slug_per_type
  on public.content_items (content_type, slug);
