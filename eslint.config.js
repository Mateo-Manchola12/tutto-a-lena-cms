// eslint.config.js
const { defineConfig } = require('eslint/config')
const js = require('@eslint/js')
const tseslint = require('typescript-eslint')
const angular = require('angular-eslint')

module.exports = defineConfig([
  // ===============================
  // Ignored paths
  // ===============================
  {
    ignores: ['dist/**', 'www/**', 'node_modules/**', '.angular/**', 'functions/**', '*.config.js'],
  },

  // ===============================
  // Base JS
  // ===============================
  js.configs.recommended,

  // ===============================
  // TypeScript
  // ===============================
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.ts'],
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
      },
    },
  })),

  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),

  // ===============================
  // Angular (TS only)
  // ===============================
  ...angular.configs.tsRecommended.map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),

  // ===============================
  // Angular Templates (HTML only)
  // ===============================
  ...angular.configs.templateRecommended.map((config) => ({
    ...config,
    files: ['**/*.html'],
  })),

  // ===============================
  // Custom rules
  // ===============================
  {
    files: ['**/*.ts'],
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],

      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/use-injectable-provided-in': 'error',
      '@angular-eslint/no-output-native': 'error',
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },

  // ===============================
  // Test files configuration
  // ===============================
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // ===============================
  // Prettier (AL FINAL)
  // ===============================
  {
    rules: require('eslint-config-prettier').rules,
  },
])
