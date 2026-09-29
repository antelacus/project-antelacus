// What the UI gate must cover: templates × contexts × states (DESIGN §2.5). The coverage test
// (coverage.ui.mjs) reconciles every accessibility check actually run against this list, so a filter that
// quietly narrows a check fails the gate instead of passing it.
import { devices } from 'playwright';

// supabase/seed.sql wrote these.
export const SEED = {
  post: '2025-07-13-llm-note', // Chinese, three h2, a cover
  postTitle: '湖边的三段笔记',
  note: 'seed-note', // English, two h2
  noteTitle: 'Seed note',
  project: 'seed-project',
  projectTitle: 'Seed project',
  gallery: 'seed-album',
  galleryTitle: 'Seed album',
  tag: 'seed',
  draftTitle: 'Seed draft',
  aboutTitle: 'Seed about', // English; /fr/about falls back to it
  // Post and project covers belong on the detail page only (REQ §5.2-f).
  coverFiles: ['2025-07-13-llm-note.png', '2025-07-22-goodman.png'],
};

// The four contexts of REQ §5.1-a: two engines, touch and not, down to 320px.
export const CONTEXTS = {
  desktop: { engine: 'chromium', options: { viewport: { width: 1280, height: 800 } } },
  touchWebkit: { engine: 'webkit', options: devices['iPhone 15'] },
  touchBlink: { engine: 'chromium', options: devices['Pixel 7'] },
  narrow: { engine: 'chromium', options: { viewport: { width: 320, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
};

// Contexts only some checks use (REQ §5.1-i): a touch tablet, and a 1280px desktop zoomed to 200%.
export const EXTRA_CONTEXTS = {
  tablet: { engine: 'webkit', options: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
  zoom200: { engine: 'chromium', options: { viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 } },
};

// `text` is on the page only when it is the seeded page and not an empty shell or an error; `state` is put
// on the page before the check runs (harness.mjs, `enterState`). A state variant has kind `state`, so
// checks scoped to a kind of page see each page at rest once. `pending` names the batch that builds a
// state's trigger: until then a missing trigger is skipped and reported, and coverage.ui.mjs keeps the
// version from closing on a skip.
const p = (path) => `/en${path}`;
export const TEMPLATES = [
  { name: 'home', kind: 'home', path: p(''), text: SEED.postTitle },
  { name: 'posts', kind: 'list', path: p('/posts'), text: SEED.postTitle },
  { name: 'notes', kind: 'list', path: p('/notes'), text: SEED.noteTitle },
  { name: 'projects', kind: 'list', path: p('/projects'), text: SEED.projectTitle },
  { name: 'gallery', kind: 'list', path: p('/gallery'), text: SEED.galleryTitle },
  { name: 'tag', kind: 'list', path: p(`/tags/${SEED.tag}`), text: SEED.noteTitle },
  { name: 'tags', kind: 'tags', path: p('/tags'), text: SEED.tag },
  { name: 'post', kind: 'detail', path: p(`/posts/${SEED.post}`), text: SEED.postTitle },
  { name: 'note', kind: 'detail', path: p(`/notes/${SEED.note}`), text: SEED.noteTitle },
  { name: 'project', kind: 'detail', path: p(`/projects/${SEED.project}`), text: SEED.projectTitle },
  { name: 'album', kind: 'detail', path: p(`/gallery/${SEED.gallery}`), text: SEED.galleryTitle },
  { name: 'about', kind: 'about', path: p('/about'), text: SEED.aboutTitle },
  { name: '404', kind: '404', path: p('/no-such-section'), status: 404, text: 'Page not found' },
  // The interface in other languages; content is single-source, so the seed titles are the same.
  { name: 'home zh-HK', kind: 'home', path: `/zh-HK`, text: SEED.postTitle },
  { name: 'posts fr', kind: 'list', path: `/fr/posts`, text: SEED.postTitle },
  { name: 'post es', kind: 'detail', path: `/es/posts/${SEED.post}`, text: SEED.postTitle },
  { name: 'search open', kind: 'state', path: p(''), state: 'search', text: SEED.postTitle },
  { name: 'viewer open', kind: 'state', path: p(`/gallery/${SEED.gallery}`), state: 'viewer', text: SEED.galleryTitle },
  { name: 'toc open', kind: 'state', path: p(`/posts/${SEED.post}`), state: 'toc', text: SEED.postTitle },
  { name: 'row hovered', kind: 'state', path: p('/posts'), state: 'hover', text: SEED.postTitle },
  { name: 'link focused', kind: 'state', path: p(`/posts/${SEED.post}`), state: 'focus', text: SEED.postTitle },
];

// `anonymous` pages are opened without the synthetic admin's session.
export const ADMIN_TEMPLATES = [
  { name: 'login', path: '/admin/login', anonymous: true, text: 'Sign in' },
  { name: 'overview', path: '/admin', text: 'published' },
  { name: 'list', path: '/admin/content/post', text: SEED.draftTitle },
  { name: 'editor', path: `/admin/content/post/${SEED.post}`, text: SEED.postTitle },
  // Every other content type and the about page (REQ release-pipeline §5.10-d).
  { name: 'note list', path: '/admin/content/note', text: SEED.noteTitle },
  { name: 'note editor', path: `/admin/content/note/${SEED.note}`, text: SEED.noteTitle },
  { name: 'gallery list', path: '/admin/content/gallery', text: SEED.galleryTitle },
  { name: 'gallery editor', path: `/admin/content/gallery/${SEED.gallery}`, text: SEED.galleryTitle },
  { name: 'project list', path: '/admin/content/project', text: SEED.projectTitle },
  { name: 'project editor', path: `/admin/content/project/${SEED.project}`, text: SEED.projectTitle },
  { name: 'about languages', path: '/admin/pages/about', text: 'en' },
  { name: 'about editor', path: '/admin/pages/about/en', text: SEED.aboutTitle },
];
