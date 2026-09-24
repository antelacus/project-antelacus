// The ids the site's own markup gives elements on every page. Rendered Markdown never reuses one
// (src/lib/markdown/headings.ts), so a skip link or an aria-labelledby always has a single target.
export const PAGE_IDS = {
  main: 'main-content',
  nav: 'site-nav',
  contents: 'contents',
  searchTitle: 'search-title',
  searchField: 'search-field',
} as const;
