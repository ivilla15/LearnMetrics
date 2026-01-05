// .eslintrc.js
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'jsx-a11y'],
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // ✅ Modern React doesn't need React in scope for JSX
    'react/react-in-jsx-scope': 'off',

    // ✅ Allow `any` for now so you can move fast
    '@typescript-eslint/no-explicit-any': 'off',

    // ✅ Unused vars are okay during development
    '@typescript-eslint/no-unused-vars': 'off',

    // ✅ Tailwind config and some tooling still uses require()
    '@typescript-eslint/no-require-imports': 'off',
  },
};
