import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

/**
 * Reglas compartidas del monorepo.
 *
 * Fronteras que se hacen cumplir:
 * - Las apps no llaman a `fetch` ni a clientes HTTP a mano: todo pasa por el cliente generado.
 * - `packages/core` no depende de React ni de React Native (debe correr en Node).
 */
export const web = [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, 'react-hooks': hooks, 'jsx-a11y': a11y },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...hooks.configs.recommended.rules,
      ...a11y.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Patrón intencional: estado inicial de carga y sincronización con la URL.
      // La regla del compilador sugiere moverlo a eventos; aquí el efecto ES el disparador.
      'react-hooks/set-state-in-effect': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Las apps usan @uni-market/api-client; prohibido fetch a mano.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'axios', message: 'El cliente HTTP es el generado desde el contrato.' },
            { name: 'superagent', message: 'El cliente HTTP es el generado desde el contrato.' },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/**/*.{js,mjs}'],
    rules: { 'no-restricted-globals': 'off' },
  },
  {
    files: ['packages/core/**/*.{js,mjs}'],
    rules: {
      'no-restricted-imports': ['error', { paths: ['react', 'react-dom', 'react-native'] }],
    },
  },
  {
    files: ['**/test/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.jest } },
  },
  prettier,
];
