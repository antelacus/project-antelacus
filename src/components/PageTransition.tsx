import { ViewTransition, type ReactNode } from 'react';

// The one page-to-page motion (docs/aesthetic-thesis.md, 四): a short fade, only for a navigation a
// reader started from a site link (SiteLink tags it `page`). Back and forward, a refresh and the first
// load do not animate. Each page wraps itself: a layout persists across navigations, so a wrapper there
// would never see content enter or leave (DESIGN §2.4).
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={{ page: 'page-fade', default: 'none' }} exit={{ page: 'page-fade', default: 'none' }} default="none">
      {children}
    </ViewTransition>
  );
}
