import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// Next 16 removed `next lint`; eslint runs directly and eslint-config-next ships flat configs only.
export default defineConfig([
  globalIgnores(['.next/**', '.next-ui/**', 'node_modules/**', 'scripts/tests/**']),
  ...nextVitals,
  ...nextTs,
]);
