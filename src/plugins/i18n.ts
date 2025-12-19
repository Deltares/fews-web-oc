import { createI18n, I18n, I18nOptions } from 'vue-i18n'
import messages from '@intlify/unplugin-vue-i18n/messages'

const datetimeFormats: I18nOptions['datetimeFormats'] = {
  en: {
    timeControlMenu__appBar: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    },
    timeControlMenu__browserTime: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    },
    timeSeriesTable__date: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    },
  },
  de: {
    timeControlMenu__appBar: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    },
    timeControlMenu__browserTime: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    },
    timeSeriesTable__date: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    },
  },
}

export async function loadLocaleMessages(locale: string) {
  const response = await fetch(
    `${import.meta.env.BASE_URL}locales/${locale}.json`,
  )
  return response.json()
}

export async function setI18nLanguage(
  i18n: I18n<{}, {}, {}, string, false>,
  locale: string,
) {
  i18n.global.locale.value = locale
  document.querySelector('html')?.setAttribute('lang', locale)
}

export const i18n = createI18n({
  legacy: false,
  fallbackLocale: 'en',
  messages,
  datetimeFormats,
  fallbackWarn: false,
  missingWarn: false,
})
