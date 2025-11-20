module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-vue'],
  overrides: [
    {
      files: ['**/*.vue', '**/*.html'],
      customSyntax: 'postcss-html',
    },
  ],
  rules: {
    'no-empty-source': null,
    'selector-class-pattern': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'media-feature-range-notation': null,
    'no-duplicate-selectors': null,
    'selector-pseudo-class-no-unknown': null,
    'at-rule-no-unknown': [
      true,
      { ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen'] },
    ],
    'rule-empty-line-before': null,
  },
}
