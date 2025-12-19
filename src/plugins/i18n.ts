import { I18n } from 'vue-i18n'

export const SUPPORT_LOCALES = ['en', 'de']

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
  const localeMessages = await loadLocaleMessages(locale)
  i18n.global.setLocaleMessage(locale, localeMessages)

  document.querySelector('html')?.setAttribute('lang', locale)
}
