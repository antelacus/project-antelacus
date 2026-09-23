-- Synthetic content for the UI gate, written through the same function the admin saves with. Each item
-- carries what some check needs to have something to judge (DESIGN §2.5); tests/ui/manifest.mjs names
-- these slugs and titles. Images are files committed under public/images: next/image admits only the
-- hosted storage over https, never the local stack.

-- The production post's slug, so tests/runtime runs unchanged against this stack and against production.
-- Chinese under every URL language; three h2 (a TOC); a cover; two tags.
select public.save_content_item($${
  "content_type":"post","slug":"2025-07-13-llm-note","title":"湖边的三段笔记",
  "summary":"一篇合成的中文专栏，供界面闸门检查。",
  "body_markdown":"导语之后的第一段。\n\n## 第一节\n\n正文，带一个[链接](https://example.com)。\n\n## 第二节\n\n![示意图](/images/posts/content/2025-07-13-llm-note/image1.png)\n\n## 第三节\n\n> 一段引用。\n\n```\ncode block\n```",
  "locale":"zh-CN","status":"published","published_at":"2026-01-05T00:00:00Z",
  "cover_image_url":"/images/posts/covers/2025-07-13-llm-note.png","tags":["seed","湖"]
}$$::jsonb);

-- Two h2: one short of a TOC.
select public.save_content_item($${
  "content_type":"note","slug":"seed-note","title":"Seed note",
  "summary":"A synthetic note with two sections.",
  "body_markdown":"## First\n\nA sentence.\n\n## Second\n\n- one\n- two",
  "locale":"en","status":"published","published_at":"2026-01-04T00:00:00Z","tags":["seed"]
}$$::jsonb);

select public.save_content_item($${
  "content_type":"project","slug":"seed-project","title":"Seed project",
  "summary":"A synthetic project with a cover and two links.",
  "body_markdown":"What the project does.","locale":"en","status":"published","published_at":"2026-01-03T00:00:00Z",
  "cover_image_url":"/images/posts/covers/2025-07-22-goodman.png","extra_metadata":{"status":"active"},
  "links":[{"label":"Repository","url":"https://github.com/example/seed","link_type":"repository"},
           {"label":"Demo","url":"https://example.com/demo","link_type":"demo"}],
  "tags":["seed"]
}$$::jsonb);

select public.save_content_item($${
  "content_type":"gallery","slug":"seed-album","title":"Seed album",
  "summary":"A synthetic album of two photos.",
  "body_markdown":"","locale":"en","status":"published","published_at":"2026-01-02T00:00:00Z",
  "extra_metadata":{"location":"Nowhere"},
  "images":[{"storage_path":"seed-album/1.png","public_url":"/images/posts/content/2025-07-13-llm-note/image2.png","alt_text":"First photo"},
            {"storage_path":"seed-album/2.png","public_url":"/images/posts/content/2025-07-13-llm-note/image3.png","alt_text":"Second photo"}],
  "tags":["seed"]
}$$::jsonb);

-- A draft: the admin list has a non-public row, and no public page may show it.
select public.save_content_item($${
  "content_type":"post","slug":"seed-draft","title":"Seed draft","body_markdown":"Draft.",
  "locale":"en","status":"draft"
}$$::jsonb);
