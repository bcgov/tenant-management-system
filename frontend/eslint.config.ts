import tsEslint from '@typescript-eslint/eslint-plugin'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginCypress from 'eslint-plugin-cypress/flat'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// ---- Shared base rules ----
const baseRules = {
  // Code quality
  curly: ['error', 'all'],
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'no-throw-literal': 'error',
  'prefer-promise-reject-errors': 'error',

  // General best practices
  //'no-console': ['warn', { allow: ['warn', 'error'] }], TODO: enable later
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
      '**/types/**',
    ],
  },

  // TS files
  {
    files: ['**/*.{ts,mts,tsx}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        project: [
          './tsconfig.app.json',
          './tsconfig.node.json',
          './tsconfig.vitest.json',
          'cypress/tsconfig.json',
        ],
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': tsEslint },
    rules: baseRules,
  },

  // Vue files
  ...pluginVue.configs['flat/essential'],
  ...pluginVue.configs['flat/strongly-recommended'],
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 'latest',
        extraFileExtensions: ['.vue'],
        parser: tsParser,
        project: './tsconfig.app.json',
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': tsEslint },
    rules: {
      ...baseRules,
      // Vue formatting
      'vue/attributes-order': [
        'error',
        {
          order: [
            'DEFINITION',
            'LIST_RENDERING',
            'CONDITIONALS',
            'RENDER_MODIFIERS',
            'GLOBAL',
            'UNIQUE',
            'SLOT',
            'TWO_WAY_BINDING',
            'OTHER_DIRECTIVES',
            'ATTR_DYNAMIC',
            'ATTR_STATIC',
            'ATTR_SHORTHAND_BOOL',
            'EVENTS',
            'CONTENT',
          ],
          alphabetical: true,
        },
      ],
      // Vue component naming and structure
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        {
          ignores: [
            // All Vuetify components
            '/^v-/',
            // Vue Router components
            'router-link',
            'router-view',
            // Vue built-ins
            'component',
            'keep-alive',
            'slot',
            'template',
            'transition',
            'transition-group',
          ],
          registeredComponentsOnly: false,
        },
      ],
      'vue/html-self-closing': [
        'error',
        {
          html: {
            component: 'always',
            normal: 'always',
            void: 'always',
          },
        },
      ],
      'vue/max-attributes-per-line': [
        'error',
        {
          multiline: { max: 1 },
          singleline: { max: 1 },
        },
      ],
    },
  },

  // Vitest test files
  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  // Cypress test files
  {
    ...pluginCypress.configs.recommended,
    files: [
      'cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}',
      'cypress/support/**/*.{js,ts,jsx,tsx}',
    ],
  },

  skipFormatting,

  {
    files: ['**/*.{ts,tsx,vue,js,jsx}'],
    plugins: { prettier: require('eslint-plugin-prettier') },
    rules: {
      // 'prettier/prettier': 'error', TODO: enable later
      'prettier/prettier': 'off',
    },
  },
]

export default config
