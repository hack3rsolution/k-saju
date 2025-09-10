module.exports = {
  root: true, // ⬅️ 상위(루트) .eslintrc 탐색 중단
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  ignorePatterns: [
    '.next/**',
    'node_modules/**',
    'dist/**',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
