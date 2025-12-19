import { createI18n, I18n, I18nOptions } from 'vue-i18n'

export const SUPPORT_LOCALES = ['en', 'de']

const datetimeFormats: I18nOptions['datetimeFormats'] = {
  'en': {
    timeControlAppBar: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    },
    timeControlBrowserTime: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    },
  },
  'de': {
    timeControlAppBar: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    },
    timeControlBrowserTime: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    },
  },
  'nl': {
    timeControlAppBar: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    },
    timeControlBrowserTime: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
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
  console.log(' Setting locale to', locale)
  i18n.global.locale.value = locale
  const localeMessages = await loadLocaleMessages(locale)
  i18n.global.setLocaleMessage(locale, localeMessages)
  i18n.global.setDateTimeFormat(locale, {
    short: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  })
  document.querySelector('html')?.setAttribute('lang', locale)
}

export const i18n = createI18n({
  legacy: false,
  fallbackLocale: 'en',
  datetimeFormats,
  fallbackWarn: false,
})
