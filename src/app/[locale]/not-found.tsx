// Only a backstop: every 404 the site can foresee under a language is decided by the proxy and answered by
// src/app/global-not-found.tsx, because this one is never rendered on the server (routing-slimdown DESIGN §6, §8).
export { default } from '@/components/NotFoundPage';
