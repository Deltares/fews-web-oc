import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import DefaultUserSettings from '@/assets/DefaultUserSettings.json'
import type { UserSettingsItem } from '@/stores/userSettings'
import en from '@/locales/en.json'
import de from '@/locales/de.json'

const defaultUserSettings = DefaultUserSettings as UserSettingsItem[]

// Numeric option values are formatted rather than translated.
const untranslatedOptions = new Set(['ui.scale'])

describe.each([
  ['en', en],
  ['de', de],
])('%s user settings translations', (locale, messages) => {
  const { te } = createI18n({
    legacy: false,
    locale,
    messages: { [locale]: messages },
  }).global

  it.each(defaultUserSettings.map((s) => [s.id, s] as const))(
    'has a label and option titles for %s',
    (id, setting) => {
      const key = `userSettings.items.${id}`
      expect(te(`${key}.label`), `${key}.label`).toBe(true)

      if (setting.type !== 'oneOfMultiple' || untranslatedOptions.has(id))
        return
      for (const option of setting.items) {
        const optionKey = `${key}.options.${option.value}`
        expect(te(optionKey), optionKey).toBe(true)
      }
    },
  )

  it('has a title for every group', () => {
    const groups = new Set(defaultUserSettings.map((s) => s.group))
    for (const group of groups) {
      expect(te(`userSettings.groups.${group}`), group).toBe(true)
    }
  })
})
