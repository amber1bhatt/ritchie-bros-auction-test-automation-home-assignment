/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:playwright/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    // every expect needs a message so the reporter can print it
    'playwright/valid-expect': ['error', { minArgs: 2 }],
  },
  ignorePatterns: ['node_modules/', 'playwright-report/', 'test-results/', 'blob-report/'],
};
