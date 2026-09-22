import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// Next 16 removed `next lint`; eslint runs directly and eslint-config-next ships flat configs only.
export default defineConfig([
  globalIgnores(['.next/**', 'node_modules/**', 'scripts/tests/**']),
  ...nextVitals,
  ...nextTs,
  {
    // TD-020: eslint-config-next 16 brought React Compiler's hook rules; the components they flag
    // (cards, Nav, SearchModal, PhotoViewer, UtilityDropdown) are rewritten in v2.4.0. Warnings until
    // then; delete this block with that version.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
]);
