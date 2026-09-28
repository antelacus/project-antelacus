#!/usr/bin/env bash
# Applies every migration to a throwaway Postgres (same major as Supabase's) and exercises
# save_content_item: idempotent on the natural key, update by id, relations replaced, publication
# date kept, cover dropped when not in the image set, and all-or-nothing on a failing relation.
# Needs Docker. Prints one line per check; exits non-zero on the first failure.
set -euo pipefail
cd "$(dirname "$0")/.."

PG_MAJOR="${PG_MAJOR:-17}"
NAME="antelacus-db-check"
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -e POSTGRES_PASSWORD=check -e POSTGRES_DB=app "postgres:$PG_MAJOR" >/dev/null
trap 'docker rm -f "$NAME" >/dev/null' EXIT
for _ in $(seq 1 30); do docker exec "$NAME" pg_isready -U postgres -d app >/dev/null 2>&1 && break; sleep 1; done

psql() { docker exec -i "$NAME" psql -v ON_ERROR_STOP=1 -U postgres -d app -q -t -A "$@"; }

# Supabase's roles, so the grants in the migrations resolve; like Supabase's, the service role bypasses RLS.
psql <<'SQL'
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role bypassrls; end if;
end $$;
SQL
for f in supabase/migrations/*.sql; do psql < "$f"; done
echo "migrations applied: $(ls supabase/migrations/*.sql | wc -l | tr -d ' ')"

check() { local label="$1" expected="$2" got="$3"; if [[ "$got" == "$expected" ]]; then echo "ok   $label"; else echo "FAIL $label: expected [$expected] got [$got]"; exit 1; fi; }

save() { psql -c "select id from public.save_content_item('$1'::jsonb);"; }

base='"content_type":"note","slug":"twice","title":"Twice","body_markdown":"b","locale":"en","status":"draft"'
id1=$(save "{$base,\"tags\":[\"a\",\"b\"]}")
id2=$(save "{$base,\"title\":\"Twice, edited\",\"tags\":[\"b\",\"c\"]}")
check "second save of the same natural key is an update" "$id1" "$id2"
check "one row" "1" "$(psql -c "select count(*) from public.content_items where slug='twice'")"
check "title updated" "Twice, edited" "$(psql -c "select title from public.content_items where id='$id1'")"
check "tags replaced" "b,c" "$(psql -c "select string_agg(t.name, ',' order by t.name) from public.content_item_tags it join public.content_tags t on t.id=it.tag_id where it.content_item_id='$id1'")"
check "a draft has no publication date" "" "$(psql -c "select published_at from public.content_items where id='$id1'")"
save "{$base,\"id\":\"$id1\",\"published_at\":\"2024-05-01T00:00:00Z\",\"status\":\"draft\"}" >/dev/null
check "a draft with an explicit date still has no publication date" "" "$(psql -c "select published_at from public.content_items where id='$id1'")"
check "omitted metadata keeps the row's own" "kept" "$(psql -c "update public.content_items set extra_metadata='{\"location\":\"kept\"}' where id='$id1'; select public.save_content_item('{$base,\"id\":\"$id1\"}'::jsonb) is not null; select extra_metadata->>'location' from public.content_items where id='$id1'" | tail -1)"
check "an explicit null array is an empty array" "0" "$(psql -c "select count(*) from public.gallery_images where content_item_id = (select id from public.save_content_item('{$base,\"id\":\"$id1\",\"images\":null,\"tags\":null,\"links\":null}'::jsonb))")"

save "{$base,\"id\":\"$id1\",\"status\":\"published\",\"tags\":[]}" >/dev/null
first=$(psql -c "select published_at from public.content_items where id='$id1'")
check "publishing sets the date" "true" "$(psql -c "select ('$first'::timestamptz is not null)::text")"
save "{$base,\"id\":\"$id1\",\"slug\":\"renamed\",\"status\":\"draft\"}" >/dev/null
check "update by id can rename the slug" "renamed" "$(psql -c "select slug from public.content_items where id='$id1'")"
check "old address is gone" "0" "$(psql -c "select count(*) from public.content_items where slug='twice'")"
save "{$base,\"id\":\"$id1\",\"slug\":\"renamed\",\"status\":\"published\"}" >/dev/null
check "re-publishing keeps the original date" "$first" "$(psql -c "select published_at from public.content_items where id='$id1'")"

gid=$(save '{"content_type":"gallery","slug":"album","title":"A","body_markdown":"","locale":"en","status":"draft","cover_image_url":"https://x/elsewhere.jpg","images":[{"storage_path":"album/1.jpg","public_url":"https://x/1.jpg"},{"storage_path":"album/2.jpg","public_url":"https://x/2.jpg","alt_text":"two"}]}')
check "two images stored in order" "1:https://x/1.jpg,2:https://x/2.jpg" "$(psql -c "select string_agg(sort_order||':'||public_url, ',' order by sort_order) from public.gallery_images where content_item_id='$gid'")"
check "a cover outside the image set is dropped" "" "$(psql -c "select cover_image_url from public.content_items where id='$gid'")"
save "{\"content_type\":\"gallery\",\"id\":\"$gid\",\"slug\":\"album\",\"title\":\"A\",\"body_markdown\":\"\",\"locale\":\"en\",\"status\":\"draft\",\"cover_image_url\":\"https://x/2.jpg\",\"images\":[{\"storage_path\":\"album/2.jpg\",\"public_url\":\"https://x/2.jpg\"}]}" >/dev/null
check "images replaced wholesale" "https://x/2.jpg" "$(psql -c "select string_agg(public_url, ',') from public.gallery_images where content_item_id='$gid'")"
check "a cover inside the set is kept" "https://x/2.jpg" "$(psql -c "select cover_image_url from public.content_items where id='$gid'")"

pid=$(save '{"content_type":"project","slug":"tool","title":"T","body_markdown":"","locale":"en","status":"draft","links":[{"label":"Repo","url":"https://github.com/x","link_type":"repository"}]}')
check "links stored" "repository:https://github.com/x" "$(psql -c "select string_agg(link_type||':'||url, ',') from public.project_links where content_item_id='$pid'")"

set +e
psql -c "select public.save_content_item('{\"content_type\":\"gallery\",\"slug\":\"broken\",\"title\":\"B\",\"body_markdown\":\"\",\"locale\":\"en\",\"status\":\"draft\",\"images\":[{\"storage_path\":\"b/1.jpg\"}]}'::jsonb);" >/dev/null 2>&1
status=$?
set -e
check "a failing relation fails the call" "1" "$( [[ $status -ne 0 ]] && echo 1 || echo 0 )"
check "and leaves no parent row behind" "0" "$(psql -c "select count(*) from public.content_items where slug='broken'")"

check "slug unique per type across locales" "1" "$( psql -c "insert into public.content_items (content_type, slug, title, body_markdown, locale) values ('note','renamed','x','','fr');" >/dev/null 2>&1 && echo 0 || echo 1 )"
check "anon cannot call the function" "1" "$( psql -c "set role anon; select public.save_content_item('{}'::jsonb);" >/dev/null 2>&1 && echo 0 || echo 1 )"
# site_pages: the about migration's rows, who may read and write, and a re-run that must not overwrite.
check "the about page is in five languages, all published, none empty" "5" "$(psql -c "select count(*) from public.site_pages where slug='about' and status='published' and length(trim(body_markdown)) > 0 and length(trim(title)) > 0")"
psql -c "insert into public.site_pages (slug, locale, title, body_markdown, status) values ('check','en','T','B','draft'), ('check','fr','T','B','published');" >/dev/null
check "anon reads the published version only" "fr" "$(psql -c "set role anon; select string_agg(locale, ',') from public.site_pages where slug='check';" | tail -1)"
check "anon cannot write a page" "1" "$( psql -c "set role anon; insert into public.site_pages (slug, locale, title, body_markdown) values ('check','es','T','B');" >/dev/null 2>&1 && echo 0 || echo 1 )"
check "authenticated cannot update a page" "1" "$( psql -c "set role authenticated; update public.site_pages set title='x' where slug='check';" >/dev/null 2>&1 && echo 0 || echo 1 )"
before=$(psql -c "select updated_at from public.site_pages where slug='check' and locale='en'")
psql -c "set role service_role; insert into public.site_pages (slug, locale, title, body_markdown, status) values ('check','en','T2','B2','published') on conflict (slug, locale) do update set title=excluded.title, body_markdown=excluded.body_markdown, status=excluded.status;" >/dev/null
check "the service role upserts by page and language" "1:T2:published" "$(psql -c "select count(*)||':'||max(title)||':'||max(status::text) from public.site_pages where slug='check' and locale='en'")"
check "an update moves updated_at" "true" "$(psql -c "select (updated_at > '$before'::timestamptz)::text from public.site_pages where slug='check' and locale='en'")"
psql -c "update public.site_pages set title='Edited in the admin' where slug='about' and locale='en';" >/dev/null
psql < supabase/migrations/20260923100100_about_content.sql >/dev/null
check "re-running the about migration keeps an admin edit" "Edited in the admin" "$(psql -c "select title from public.site_pages where slug='about' and locale='en'")"
# REQ release-pipeline §5.8-a: the admin reads drafts through its session; any other signed-in user does not.
as_user() { psql -c "set role authenticated; set request.jwt.claims = '$1'; $2" | tail -1; }
admin_claims='{"role":"authenticated","app_metadata":{"role":"admin"}}'
member_claims='{"role":"authenticated","app_metadata":{}}'
drafts="select count(*) from public.content_items where status = 'draft'"
psql -c "insert into public.site_pages (slug, locale, title, body_markdown, status) values ('rls','en','T','B','draft');" >/dev/null
check "there are drafts to hide" "true" "$(psql -c "select (($drafts) > 0)::text")"
check "§5.8-a a signed-in non-admin reads no draft" "0" "$(as_user "$member_claims" "$drafts")"
check "§5.8-a a user cannot claim admin through the top-level role" "0" "$(as_user '{"role":"admin"}' "$drafts")"
check "§5.8-a the admin reads every draft" "$(psql -c "$drafts")" "$(as_user "$admin_claims" "$drafts")"
check "§5.8-a the admin reads a draft page version" "1" "$(as_user "$admin_claims" "select count(*) from public.site_pages where slug='rls' and status='draft'")"
check "§5.8-a a non-admin does not" "0" "$(as_user "$member_claims" "select count(*) from public.site_pages where slug='rls' and status='draft'")"
check "§5.8-a anon reads no draft" "0" "$(psql -c "set role anon; $drafts" | tail -1)"
check "§5.8-a the admin still cannot write" "1" "$( psql -c "set role authenticated; set request.jwt.claims = '$admin_claims'; update public.content_items set title='x';" >/dev/null 2>&1 && echo 0 || echo 1 )"
check "§5.8-a nor call the save function" "1" "$( psql -c "set role authenticated; set request.jwt.claims = '$admin_claims'; select public.save_content_item('{}'::jsonb);" >/dev/null 2>&1 && echo 0 || echo 1 )"
echo "all checks passed"
