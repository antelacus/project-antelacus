create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'content_type_enum'
  ) then
    create type public.content_type_enum as enum ('post', 'note', 'project', 'gallery');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'content_status_enum'
  ) then
    create type public.content_status_enum as enum ('draft', 'published');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'project_link_type_enum'
  ) then
    create type public.project_link_type_enum as enum ('repository', 'demo', 'reference', 'other');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  content_type public.content_type_enum not null,
  slug text not null,
  title text not null,
  summary text,
  body_markdown text not null,
  status public.content_status_enum not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  locale text not null default 'zh-CN',
  cover_image_url text,
  seo_title text,
  seo_description text,
  extra_metadata jsonb,
  constraint content_items_slug_per_type_locale unique (content_type, locale, slug)
);

create table if not exists public.content_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.content_item_tags (
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  tag_id uuid not null references public.content_tags(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (content_item_id, tag_id)
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  captured_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_links (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  label text not null,
  url text not null,
  link_type public.project_link_type_enum not null default 'other',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists content_items_status_idx
  on public.content_items (status, content_type, published_at desc);

create index if not exists content_items_slug_lookup_idx
  on public.content_items (content_type, locale, slug);

create index if not exists gallery_images_content_item_sort_idx
  on public.gallery_images (content_item_id, sort_order);

create index if not exists project_links_content_item_idx
  on public.project_links (content_item_id);

drop trigger if exists set_content_items_updated_at on public.content_items;
create trigger set_content_items_updated_at
before update on public.content_items
for each row
execute function public.set_updated_at();

alter table public.content_items enable row level security;
alter table public.content_tags enable row level security;
alter table public.content_item_tags enable row level security;
alter table public.gallery_images enable row level security;
alter table public.project_links enable row level security;

drop policy if exists "published content readable" on public.content_items;
create policy "published content readable"
on public.content_items
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "published tags readable" on public.content_tags;
create policy "published tags readable"
on public.content_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_item_tags content_item_tags
    join public.content_items content_items
      on content_items.id = content_item_tags.content_item_id
    where content_item_tags.tag_id = content_tags.id
      and content_items.status = 'published'
  )
);

drop policy if exists "published content tag links readable" on public.content_item_tags;
create policy "published content tag links readable"
on public.content_item_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_items content_items
    where content_items.id = content_item_id
      and content_items.status = 'published'
  )
);

drop policy if exists "published gallery images readable" on public.gallery_images;
create policy "published gallery images readable"
on public.gallery_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_items content_items
    where content_items.id = content_item_id
      and content_items.status = 'published'
  )
);

drop policy if exists "published project links readable" on public.project_links;
create policy "published project links readable"
on public.project_links
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_items content_items
    where content_items.id = content_item_id
      and content_items.status = 'published'
  )
);
