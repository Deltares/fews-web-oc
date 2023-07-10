import Vue from 'vue'
import VueI18n, { LocaleMessages } from 'vue-i18n'
import { dateTimeFormats } from './locales/dateTimeFormats'
import {allLocales} from './lib/Localization/Locales'

Vue.use(VueI18n)

function loadLocaleMessages (): LocaleMessages {
  const locales = allLocales()
  const messages: LocaleMessages = {}
  locales.keys().forEach(key => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key)
    }
  })
  return messages
}

export default new VueI18n({
  locale: process.env.VUE_APP_I18N_LOCALE || 'nl',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'nl',
  messages: loadLocaleMessages(),
  dateTimeFormats
})
