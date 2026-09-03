/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 80,
  tabWidth: 2,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    {
      files: ['*.tsx', '*.jsx'],
      options: { singleQuote: false, jsxSingleQuote: false },
    },
    {
      files: ['*.md'],
      options: { proseWrap: 'preserve' },
    },
  ],
};
