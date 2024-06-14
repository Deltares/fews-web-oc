import { createI18n } from 'vue-i18n'
import { messages, datetimeFormats } from '../locales/index.js'

export const i18n = createI18n<false>({
  legacy: false,
  locale: import.meta.env.VITE_I18N_LOCALE || 'en',
  fallbackLocale: import.meta.env.VITE_I18N_FALLBACK_LOCALE || 'en',
  messages,
  datetimeFormats,
  globalInjection: true,
})
