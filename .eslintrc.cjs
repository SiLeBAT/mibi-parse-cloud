/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: { project: ['./tsconfig.json'] },
  root: true,
  ignorePatterns: ['src/**/*.spec.ts', 'dist/*', 'lib/*']
};
