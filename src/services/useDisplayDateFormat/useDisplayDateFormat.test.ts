// @vitest-environment jsdom
import { createApp, defineComponent } from 'vue'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, test } from 'vitest'
import { setDisplayTimeZone } from '@/lib/date/timeZone'
import { useDisplayDateFormat } from './index'

const time = { hour: '2-digit', minute: '2-digit', hour12: false } as const

function setup(locale: string) {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en-GB',
    datetimeFormats: {
      'en-GB': { time, date: { day: 'numeric' } },
      de: { time },
    },
  })
  let result!: ReturnType<typeof useDisplayDateFormat>
  const app = createApp(
    defineComponent({
      setup() {
        result = useDisplayDateFormat()
        return () => null
      },
    }),
  )
  app.use(i18n)
  app.mount(document.createElement('div'))
  return result
}

afterEach(() => setDisplayTimeZone('system'))

describe('useDisplayDateFormat', () => {
  const date = new Date('2026-01-01T00:30:00Z')

  test('formats in the display time zone', () => {
    const { d } = setup('en-GB')
    setDisplayTimeZone('UTC')
    expect(d(date, 'time')).toBe('00:30')
    setDisplayTimeZone('Asia/Tokyo')
    expect(d(date, 'time')).toBe('09:30')
  })

  test('uses the format of the fallback locale for a missing key', () => {
    const { d } = setup('de')
    setDisplayTimeZone('UTC')
    expect(d(date, 'date')).toBe('1')
  })
})
