import {getRequestConfig} from 'next-intl/server';
import {defaultLocale, isSupportedLocale, type AppLocale} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  const maybe = await requestLocale;
  const locale: AppLocale = isSupportedLocale(maybe) ? maybe : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default as Record<string, unknown>
  };
});


