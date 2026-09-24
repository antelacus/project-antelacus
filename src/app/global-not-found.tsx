import type { Metadata } from 'next';
import Link from 'next/link';
import SiteDocument from '@/components/SiteDocument';

export const metadata: Metadata = {
  title: 'Page not found | AnteLacus',
};

// The 404 for every URL that matches no route. It is served without a layout, so it brings the whole
// document itself; English, because such a URL carries no locale.
export default function GlobalNotFound() {
  return (
    <SiteDocument lang="en">
      <div className="page page-narrow">
        <div className="scroll-opening">
          <h1 className="scroll-title">Page not found</h1>
          <p className="scroll-lead">The page you are looking for does not exist or has been moved.</p>
          <p><Link href="/">Back to the front page</Link></p>
        </div>
      </div>
    </SiteDocument>
  );
}
