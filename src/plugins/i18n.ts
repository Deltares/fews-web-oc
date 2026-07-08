import { createI18n, I18n, I18nOptions } from 'vue-i18n'
import { getResourcesStaticUrl } from '@/lib/fews-config'

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

/**
 * Merges a deep partial messages object into existing i18n locale messages.
 */
function mergeMessages(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    const sourceVal = source[key]
    const targetVal = result[key]
    if (
      typeof sourceVal === 'object' &&
      sourceVal !== null &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = mergeMessages(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      )
    } else {
      result[key] = sourceVal
    }
  }
  return result
}

/**
 * Fetches locale-specific translations from FEWS WebResources and merges them
 * into the active vue-i18n messages. Falls back silently if unavailable.
 *
 * The file is expected at: <FEWS WebResources>/locales/<locale>.json
 */
export async function loadWebResourcesTranslations(
  locale: string,
): Promise<void> {
  const languageCode = locale.split('-')[0]
  const url = getResourcesStaticUrl(`locales/${languageCode}.json`)
  //ASK: if it should be in a folder or root directory
  try {
    const response = await fetch(url)
    if (!response.ok) return
    const contentType = response.headers.get('Content-Type') ?? ''
    if (contentType.includes('text/html')) return
    const remoteMessages = await response.json()
    if (typeof remoteMessages !== 'object' || remoteMessages === null) return
    const existing = i18n.global.getLocaleMessage(locale) as Record<
      string,
      unknown
    >
    const merged = mergeMessages(existing, remoteMessages)
    i18n.global.setLocaleMessage(locale, merged)
  } catch {
    // Silently ignore – web resources translations are optional
  }
}

export const i18n = createI18n({
  legacy: false,
  fallbackLocale: 'en-GB',
  messages: {},
  datetimeFormats,
  fallbackWarn: false,
})
