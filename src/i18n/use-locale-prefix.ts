'use client';

import { usePathname } from 'next/navigation';

import { isSupportedLocale } from '@/i18n/routing';

// The `/<locale>` prefix of the page being viewed, for links built on the client; empty outside the
// localized tree (the admin). One place for a computation five components used to repeat.
export function useLocalePrefix(): string {
  const pathname = usePathname() ?? '/';
  const first = pathname.split('/')[1] ?? '';
  return isSupportedLocale(first) ? `/${first}` : '';
}
