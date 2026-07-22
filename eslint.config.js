import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

const sharedRules = {
  ...js.configs.recommended.rules,
  'no-unused-vars': [
    'warn',
    {
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    },
  ],
};

export default [
  {
    ignores: [
      '**/node_modules/**',
      'frontend/dist/**',
      'backend/public/**',
      'backend/frames/**',
      'backend/logs/**',
      'backend/tmp/**',
      'wavetiles/cog/**',
      'wavetiles/geotiff/**',
      'wavetiles/input/**',
      'wavetiles/render/**',
      'wavetiles/tiles/**',
      'wavetiles/venv/**',
      'wavetiles/wavelab/**',
      'wavetiles/wave3data/**',
    ],
  },
  {
    files: ['backend/**/*.js', '.github/scripts/**/*.mjs', '*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      sourceType: 'module',
    },
    rules: sharedRules,
  },
  {
    files: ['frontend/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      sourceType: 'module',
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...sharedRules,
      ...reactHooks.configs.flat.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: [
      'backend/tests/**/*.js',
      'frontend/**/*.{test,spec}.{js,jsx}',
      'frontend/**/__tests__/**/*.{js,jsx}',
    ],
    languageOptions: {
      globals: {
        afterAll: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        test: 'readonly',
        vi: 'readonly',
      },
    },
  },
];
