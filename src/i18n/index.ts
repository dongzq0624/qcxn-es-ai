import { createI18n } from 'vue-i18n'
import zh from './locales/zh'
import en from './locales/en'
import ko from './locales/ko'

export const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    zh,
    en,
    ko,
  },
})
