import { web } from '@uni-market/config/eslint';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      'packages/api-client/src/generado/**',
      'design/**',
      'openapi/**',
    ],
  },
  ...web,
];
