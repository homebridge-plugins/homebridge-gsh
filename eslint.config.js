import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'chrome-profile/**',
    ],
  },

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        console: 'readonly',
        process: 'readonly',
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
    },

    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,

      'quotes': ['warn', 'single'],
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'semi': 'off',
      'comma-dangle': ['warn', 'always-multiline'],
      'dot-notation': 'off',
      'eqeqeq': 'warn',
      'curly': ['warn', 'all'],
      'brace-style': ['warn'],
      'prefer-arrow-callback': ['warn'],
      'max-len': ['warn', 160],
      'no-console': ['warn'],
      'no-non-null-assertion': 'off',
      'comma-spacing': ['error'],
      'no-multi-spaces': ['warn', { ignoreEOLComments: true }],
      'lines-between-class-members': [
        'warn',
        'always',
        { exceptAfterSingleLine: true },
      ],

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'off',
        { args: 'none' },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['homebridge-ui/public/src/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];