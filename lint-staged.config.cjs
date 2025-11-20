module.exports = {
  '*.{ts,js,vue}': ['pnpm eslint --fix', 'pnpm exec prettier --write'],
  '*.{css,scss,postcss,vue}': ['pnpm stylelint --fix', 'pnpm exec prettier --write'],
  '*.{json,md,yml,yaml}': ['pnpm exec prettier --write'],
}
