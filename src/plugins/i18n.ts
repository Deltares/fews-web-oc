import { createI18n, I18n, I18nOptions } from 'vue-i18n'

const datetimeFormats: I18nOptions['datetimeFormats'] = {
  'en-GB': {
    timeControl: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    },
    timeControl__mobile: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
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
    timeControl: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    },
    timeControl__mobile: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
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

type LocaleModule = () => Promise<{ default: Record<string, any> }>

const vuetifyLocales: Record<string, LocaleModule> = {
  en: () => import('vuetify/lib/locale/en.js'),
  de: () => import('vuetify/lib/locale/de.js'),
}

const appLocales: Record<string, LocaleModule> = {
  en: () => import('@/locales/en.json'),
  de: () => import('@/locales/de.json'),
}

export async function loadLocale(locale: string) {
  const messages: Record<string, any> = {}

  // Use only the language code (e.g., 'en' from 'en-US')
  const languageCode = locale.split('-')[0]

  if (vuetifyLocales[languageCode]) {
    const v = await vuetifyLocales[languageCode]()
    Object.assign(messages, { $vuetify: v.default })
  }

  if (appLocales[languageCode]) {
    const a = await appLocales[languageCode]()
    Object.assign(messages, a.default)
  }
  i18n.global.setLocaleMessage(locale, messages)
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
  await loadLocale(locale)
  document.querySelector('html')?.setAttribute('lang', locale)
}

export const i18n = createI18n({
  legacy: false,
  fallbackLocale: 'en-GB',
  messages: {},
  datetimeFormats,
  fallbackWarn: false,
})
