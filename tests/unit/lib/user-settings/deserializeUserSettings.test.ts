import { describe, it, expect } from 'vitest'
import {
  deserializeUserSettings,
  filterValidOverrides,
  isValidUserSettingsOverride,
  type UserSettingsOverride,
} from '@/lib/user-settings/deserializeUserSettings'
import {
  type UserSettingsItem,
  type UserSettingsItemBoolean,
  type UserSettingsItemOneOf,
} from '@/stores/userSettings'

const defaultSettings: UserSettingsItem[] = [
  {
    id: 'ui.theme',
    type: 'oneOfMultiple',
    label: 'Theme',
    value: 'auto',
    favorite: false,
    group: 'UI',
    items: [
      { value: 'auto', title: 'Automatic' },
      { value: 'light', title: 'Light' },
      { value: 'dark', title: 'Dark' },
    ],
  } as UserSettingsItemOneOf,
  {
    id: 'datum.verticalDatum',
    type: 'boolean',
    label: 'Absolute vertical datum',
    value: true,
    favorite: false,
    group: 'Datum',
  } as UserSettingsItemBoolean,
  {
    id: 'charts.scrollZoomMode',
    type: 'oneOfMultiple',
    label: 'Scroll wheel zoom mode',
    value: 'x',
    favorite: false,
    group: 'Charts',
    items: [
      { value: 'off', title: 'Off' },
      { value: 'x', title: 'Only X' },
      { value: 'y', title: 'Only Y' },
      { value: 'xy', title: 'Both X and Y' },
    ],
  } as UserSettingsItemOneOf,
]

function serialize(items: Partial<UserSettingsItem>[]): string {
  return JSON.stringify({ items })
}

describe('deserializeUserSettings', () => {
  it('returns defaults when no stored items match', () => {
    const data = serialize([])
    const result = deserializeUserSettings(data, defaultSettings)

    expect(result).toHaveLength(3)
    expect(result[0].value).toBe('auto')
    expect(result[1].value).toBe(true)
    expect(result[2].value).toBe('x')
  })

  it('restores stored value for oneOfMultiple', () => {
    const data = serialize([{ id: 'ui.theme', value: 'dark', favorite: false }])
    const result = deserializeUserSettings(data, defaultSettings)

    expect((result[0] as UserSettingsItemOneOf).value).toBe('dark')
  })

  it('restores stored value for boolean', () => {
    const data = serialize([
      { id: 'datum.verticalDatum', value: false, favorite: false },
    ])
    const result = deserializeUserSettings(data, defaultSettings)

    expect((result[1] as UserSettingsItemBoolean).value).toBe(false)
  })

  it('restores favorite flag', () => {
    const data = serialize([{ id: 'ui.theme', value: 'auto', favorite: true }])
    const result = deserializeUserSettings(data, defaultSettings)

    expect(result[0].favorite).toBe(true)
  })

  it('keeps default value for settings not in stored data', () => {
    const data = serialize([
      { id: 'ui.theme', value: 'light', favorite: false },
    ])
    const result = deserializeUserSettings(data, defaultSettings)

    expect(result[1].value).toBe(true)
    expect(result[2].value).toBe('x')
  })

  it('does not mutate the original defaultSettings array', () => {
    const original = defaultSettings.map((s) => ({ ...s }))
    const data = serialize([{ id: 'ui.theme', value: 'dark', favorite: true }])
    deserializeUserSettings(data, defaultSettings)

    expect(defaultSettings[0].value).toBe(original[0].value)
    expect(defaultSettings[0].favorite).toBe(original[0].favorite)
  })

  it('falls back by positional index when stored value no longer exists in items', () => {
    const data = serialize([
      {
        id: 'ui.theme',
        value: 'old-value',
        favorite: false,
        items: [
          { value: 'some-other', title: 'Other' },
          { value: 'old-value', title: 'Old' },
        ],
      },
    ])
    const result = deserializeUserSettings(data, defaultSettings)
    const theme = result[0] as UserSettingsItemOneOf

    expect(theme.value).toBe('light')
    expect(theme.initialStorageValue).toBe('old-value')
  })

  it('leaves value unchanged when positional index is also out of range', () => {
    const data = serialize([
      {
        id: 'ui.theme',
        value: 'old-value',
        favorite: false,
        items: [
          { value: 'a', title: 'A' },
          { value: 'b', title: 'B' },
          { value: 'c', title: 'C' },
          { value: 'd', title: 'D' },
          { value: 'e', title: 'E' },
          { value: 'old-value', title: 'Old' },
        ],
      },
    ])
    const result = deserializeUserSettings(data, defaultSettings)
    const theme = result[0] as UserSettingsItemOneOf

    expect(theme.value).toBe('auto')
    expect(theme.initialStorageValue).toBe('old-value')
  })

  it('handles missing items key in stored data gracefully', () => {
    const data = JSON.stringify({})
    const result = deserializeUserSettings(data, defaultSettings)

    expect(result).toHaveLength(3)
    expect(result[0].value).toBe('auto')
  })

  it('ignores stored entries that have no matching id in defaults', () => {
    const data = serialize([
      { id: 'unknown.setting', value: 'something', favorite: true },
    ])
    const result = deserializeUserSettings(data, defaultSettings)

    expect(result).toHaveLength(3)
  })

  it('restores multiple settings in one call', () => {
    const data = serialize([
      { id: 'ui.theme', value: 'dark', favorite: true },
      { id: 'datum.verticalDatum', value: false, favorite: false },
      { id: 'charts.scrollZoomMode', value: 'xy', favorite: false },
    ])
    const result = deserializeUserSettings(data, defaultSettings)

    expect(result[0].value).toBe('dark')
    expect(result[0].favorite).toBe(true)
    expect(result[1].value).toBe(false)
    expect(result[2].value).toBe('xy')
  })
})

describe('isValidUserSettingsOverride', () => {
  it('accepts an override with only id', () => {
    expect(isValidUserSettingsOverride({ id: 'ui.theme' })).toBe(true)
  })

  it('accepts a fully populated override', () => {
    expect(
      isValidUserSettingsOverride({
        id: 'ui.theme',
        value: 'dark',
        enabled: false,
        favorite: true,
      }),
    ).toBe(true)
  })

  it('accepts an override with value only', () => {
    expect(
      isValidUserSettingsOverride({ id: 'ui.theme', value: 'light' }),
    ).toBe(true)
  })

  it('accepts an override with enabled only', () => {
    expect(
      isValidUserSettingsOverride({ id: 'ui.theme', enabled: false }),
    ).toBe(true)
  })

  it('accepts an override with favorite only', () => {
    expect(
      isValidUserSettingsOverride({ id: 'ui.theme', favorite: true }),
    ).toBe(true)
  })

  it('rejects null', () => {
    expect(isValidUserSettingsOverride(null)).toBe(false)
  })

  it('rejects a string', () => {
    expect(isValidUserSettingsOverride('ui.theme')).toBe(false)
  })

  it('rejects an object without id', () => {
    expect(isValidUserSettingsOverride({ value: 'dark' })).toBe(false)
  })

  it('rejects an object with an empty id', () => {
    expect(isValidUserSettingsOverride({ id: '' })).toBe(false)
  })

  it('rejects an object with a numeric id', () => {
    expect(isValidUserSettingsOverride({ id: 42 })).toBe(false)
  })

  it('rejects an override with an unknown key', () => {
    expect(
      isValidUserSettingsOverride({ id: 'ui.theme', label: 'Theme' }),
    ).toBe(false)
  })

  it('rejects an override where enabled is not boolean', () => {
    expect(
      isValidUserSettingsOverride({ id: 'ui.theme', enabled: 'yes' }),
    ).toBe(false)
  })

  it('rejects an override where favorite is not boolean', () => {
    expect(isValidUserSettingsOverride({ id: 'ui.theme', favorite: 1 })).toBe(
      false,
    )
  })
})

describe('filterValidOverrides', () => {
  it('returns only valid entries from a mixed array', () => {
    const input: unknown[] = [
      { id: 'ui.theme', value: 'dark' },
      null,
      { value: 'missing-id' },
      { id: 'charts.scrollZoomMode', enabled: false },
    ]
    const result = filterValidOverrides(input)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('ui.theme')
    expect(result[1].id).toBe('charts.scrollZoomMode')
  })

  it('returns empty array when all entries are invalid', () => {
    expect(filterValidOverrides([null, undefined, 'bad', 42])).toHaveLength(0)
  })

  it('returns all entries when all are valid', () => {
    const input: UserSettingsOverride[] = [
      { id: 'a', value: 1 },
      { id: 'b', enabled: true },
    ]
    expect(filterValidOverrides(input)).toHaveLength(2)
  })
})

describe('deserializeUserSettings – WebResources override tier', () => {
  it('applies webresources value when localStorage has no stored entry', () => {
    const data = serialize([])
    const overrides: UserSettingsOverride[] = [
      { id: 'ui.theme', value: 'dark' },
    ]
    const result = deserializeUserSettings(data, defaultSettings, overrides)

    expect(result[0].value).toBe('dark')
  })

  it('applies webresources favorite when localStorage has no stored entry', () => {
    const data = serialize([])
    const overrides: UserSettingsOverride[] = [
      { id: 'ui.theme', favorite: true },
    ]
    const result = deserializeUserSettings(data, defaultSettings, overrides)

    expect(result[0].favorite).toBe(true)
  })

  it('applies disabled from webresources enabled:false', () => {
    const data = serialize([])
    const overrides: UserSettingsOverride[] = [
      { id: 'charts.scrollZoomMode', enabled: false },
    ]
    const result = deserializeUserSettings(data, defaultSettings, overrides)

    expect(result[2].disabled).toBe(true)
  })

  it('sets disabled:false when webresources enabled:true', () => {
    const data = serialize([])
    const overrides: UserSettingsOverride[] = [
      { id: 'ui.theme', enabled: true },
    ]
    const result = deserializeUserSettings(data, defaultSettings, overrides)

    expect(result[0].disabled).toBe(false)
  })

  it('does not set disabled when enabled is absent from override', () => {
    const data = serialize([])
    const overrides: UserSettingsOverride[] = [
      { id: 'ui.theme', value: 'dark' },
    ]
    const result = deserializeUserSettings(data, defaultSettings, overrides)

    expect(result[0].disabled).toBeUndefined()
  })

  it('localStorage value wins over webresources value (priority tier 1 > 2)', () => {
    const data = serialize([
      { id: 'ui.theme', value: 'light', favorite: false },
    ])
    const overrides: UserSettingsOverride[] = [
      { id: 'ui.theme', value: 'dark' },
    ]
    const result = deserializeUserSettings(data, defaultSettings, overrides)

    expect(result[0].value).toBe('light')
  })

  it('localStorage favorite wins over webresources favorite (priority tier 1 > 2)', () => {
    const data = serialize([{ id: 'ui.theme', value: 'auto', favorite: false }])
    const overrides: UserSettingsOverride[] = [
      { id: 'ui.theme', favorite: true },
    ]
    const result = deserializeUserSettings(data, defaultSettings, overrides)

    expect(result[0].favorite).toBe(false)
  })

  it('disabled from webresources is preserved even when localStorage has a value', () => {
    const data = serialize([
      { id: 'charts.scrollZoomMode', value: 'xy', favorite: false },
    ])
    const overrides: UserSettingsOverride[] = [
      { id: 'charts.scrollZoomMode', enabled: false },
    ]
    const result = deserializeUserSettings(data, defaultSettings, overrides)

    expect(result[2].value).toBe('xy')
    expect(result[2].disabled).toBe(true)
  })

  it('webresources value wins over assets default when localStorage is empty', () => {
    const data = serialize([])
    const overrides: UserSettingsOverride[] = [
      { id: 'datum.verticalDatum', value: false },
    ]
    const result = deserializeUserSettings(data, defaultSettings, overrides)

    expect(result[1].value).toBe(false)
  })

  it('applies overrides to multiple settings independently', () => {
    const data = serialize([])
    const overrides: UserSettingsOverride[] = [
      { id: 'ui.theme', value: 'dark', favorite: true },
      { id: 'charts.scrollZoomMode', enabled: false },
    ]
    const result = deserializeUserSettings(data, defaultSettings, overrides)

    expect(result[0].value).toBe('dark')
    expect(result[0].favorite).toBe(true)
    expect(result[2].disabled).toBe(true)
    expect(result[1].value).toBe(true)
  })

  it('ignores overrides for unknown ids', () => {
    const data = serialize([])
    const overrides: UserSettingsOverride[] = [
      { id: 'unknown.setting', value: 'something' },
    ]
    const result = deserializeUserSettings(data, defaultSettings, overrides)

    expect(result).toHaveLength(3)
    expect(result[0].value).toBe('auto')
  })

  it('returns defaults unchanged when webResourcesOverrides is empty', () => {
    const data = serialize([])
    const result = deserializeUserSettings(data, defaultSettings, [])

    expect(result[0].value).toBe('auto')
    expect(result[1].value).toBe(true)
    expect(result[2].value).toBe('x')
  })

  it('does not mutate defaults when webresources overrides are applied', () => {
    const original = defaultSettings.map((s) => ({ ...s }))
    const overrides: UserSettingsOverride[] = [
      { id: 'ui.theme', value: 'dark', favorite: true },
    ]
    deserializeUserSettings(serialize([]), defaultSettings, overrides)

    expect(defaultSettings[0].value).toBe(original[0].value)
    expect(defaultSettings[0].favorite).toBe(original[0].favorite)
  })
})
