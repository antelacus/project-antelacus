import Link from 'next/link';
import { useLocale } from 'next-intl';
import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

// Every link from one public page to another: it adds the page's locale prefix and marks the navigation
// as a page change, the one transition the site animates (DESIGN §2.4).
export default function SiteLink({ href, ...rest }: Props) {
  const locale = useLocale();
  return <Link href={`/${locale}${href === '/' ? '' : href}`} transitionTypes={['page']} {...rest} />;
}
