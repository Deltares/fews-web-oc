import Vue from 'vue'
import { createI18n, castToVueI18n } from 'vue-i18n-bridge';
import VueI18n from 'vue-i18n';
import { dateTimeFormats } from './locales/dateTimeFormats'
import messages from '@intlify/unplugin-vue-i18n/messages'

Vue.use(VueI18n, { bridge: true })

const i18n = castToVueI18n(
  createI18n({
    legacy: false,
    locale: import.meta.env.VITE_APP_I18N_LOCALE || 'nl',
    fallbackLocale: import.meta.env.VITE_APP_I18N_FALLBACK_LOCALE || 'nl',
    messages,
    dateTimeFormats
  },
  VueI18n,
  )
)

export default i18n
