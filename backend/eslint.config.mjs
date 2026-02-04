import tsEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettierPlugin from 'eslint-plugin-prettier'

// ---- Shared base rules ----
const baseRules = {
  // Code quality
  curly: ['error', 'all'],
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'no-throw-literal': 'error',
  'prefer-promise-reject-errors': 'error',

  // General best practices
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'no-debugger': 'warn',
  'no-var': 'error',
  'prefer-const': 'error',

  // Style
  'comma-dangle': ['error', 'always-multiline'],
  quotes: ['error', 'single', { avoidEscape: true }],
  semi: ['error', 'never'],

  // TypeScript
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-non-null-assertion': 'warn',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    },
  ],
}

// ---- ESLint flat config ----
const config = [
  // ignore build/output
  {
    ignores: [
      '**/.git/**',
      '**/build/**',
      '**/coverage/**',
      '**/dist/**',
      '**/dist-ssr/**',
      '**/node_modules/**',
    ],
  },

  // TS files
  {
    files: ['**/*.{ts,mts,tsx}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
      prettier: prettierPlugin,
    },
    rules: {
      ...baseRules,
      'prettier/prettier': 'error',
    },
  },
]

export default config
