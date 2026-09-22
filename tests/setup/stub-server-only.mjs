// `server-only` throws when imported outside a React Server Components bundle, which is exactly what
// a unit test is. This loader hook resolves it to an empty module so repo modules can be tested; the
// invariant that they still declare it is checked separately (tests/invariants.test.ts).
import { register, registerHooks } from 'node:module';

const EMPTY = 'data:text/javascript,export default {}';
const resolve = (specifier, context, next) =>
  specifier === 'server-only' ? { url: EMPTY, shortCircuit: true } : next(specifier, context);

if (typeof registerHooks === 'function') {
  registerHooks({ resolve });
} else {
  register('data:text/javascript,export const resolve = ' + resolve.toString().replace(/\n/g, ' '), import.meta.url);
}
