import { useI18n } from 'vue-i18n'
import { getDisplayTimeZone } from '@/lib/date/timeZone'

/**
 * Like `d` of `useI18n`, but formats dates in the display time zone of the
 * `ui.timeZone` user setting.
 */
export function useDisplayDateFormat() {
  const { d: i18nDate } = useI18n()

  function d(value: Date | number, key: string): string {
    return i18nDate(value, { key, timeZone: getDisplayTimeZone() })
  }

  return { d }
}
