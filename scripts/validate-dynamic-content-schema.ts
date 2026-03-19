import { validateDynamicContentSchemaSamples } from '../src/lib/server/database.types';

const samples = validateDynamicContentSchemaSamples();

console.log('Validated dynamic-content sample records:', Object.keys(samples).join(', '));
