import { useI18n } from 'vue-i18n'
import { getDisplayTimeZone } from '@/lib/date/timeZone'

// Formatting with a time zone option bypasses the formatter cache of
// vue-i18n, so cache the formatters per locale, key and time zone here.
const formatters = new Map<string, Intl.DateTimeFormat>()

/**
 * Like `d` of `useI18n`, but formats dates in the display time zone of the
 * `ui.timeZone` user setting.
 */
export function useDisplayDateFormat() {
  const { d: i18nDate, locale, fallbackLocale, getDateTimeFormat } = useI18n()

  function getFormatter(key: string): Intl.DateTimeFormat | undefined {
    const timeZone = getDisplayTimeZone()
    const locales = [locale.value]
    if (typeof fallbackLocale.value === 'string') {
      locales.push(fallbackLocale.value)
    }
    for (const targetLocale of locales) {
      const formats = getDateTimeFormat(targetLocale) as Record<
        string,
        Intl.DateTimeFormatOptions | undefined
      >
      const options = formats[key]
      if (!options) continue
      const cacheKey = `${targetLocale}|${key}|${timeZone ?? ''}`
      let formatter = formatters.get(cacheKey)
      if (!formatter) {
        formatter = new Intl.DateTimeFormat(targetLocale, {
          ...options,
          timeZone,
        })
        formatters.set(cacheKey, formatter)
      }
      return formatter
    }
  }

  function d(value: Date | number, key: string): string {
    const formatter = getFormatter(key)
    if (formatter) return formatter.format(value)
    return i18nDate(value, { key, timeZone: getDisplayTimeZone() })
  }

  return { d }
}
