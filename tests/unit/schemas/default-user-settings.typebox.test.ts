import { readFileSync } from 'node:fs'
import { Value } from 'typebox/value'
import { describe, expect, it } from 'vitest'
import DefaultUserSettings from '@/assets/DefaultUserSettings.json'
import {
  DefaultUserSettingSchemas,
  DefaultUserSettingsSchema,
} from '@/schemas/default-user-settings.typebox'
import testConfigSettings from './fixtures/default-user-settings.json'

function isValid(settings: unknown[]) {
  return Value.Check(DefaultUserSettingsSchema, { settings })
}

describe('DefaultUserSettingsSchema', () => {
  it('has a schema for every built-in setting', () => {
    expect(Object.keys(DefaultUserSettingSchemas)).toEqual(
      DefaultUserSettings.map((setting) => setting.id),
    )
  })

  it.each(DefaultUserSettings.map((setting) => [setting.id, setting]))(
    'accepts the built-in default of %s as override',
    (id, setting) => {
      expect(
        isValid([{ id, value: setting.value, enabled: true, favorite: false }]),
      ).toBe(true)
    },
  )

  it.each(DefaultUserSettings.map((setting) => [setting.id]))(
    'only requires the id for %s',
    (id) => {
      expect(isValid([{ id }])).toBe(true)
    },
  )

  it('accepts the test-config default-user-settings.json', () => {
    expect(Value.Check(DefaultUserSettingsSchema, testConfigSettings)).toBe(
      true,
    )
  })

  it('accepts any base map for ui.map.theme', () => {
    expect(isValid([{ id: 'ui.map.theme', value: 'osm-bright' }])).toBe(true)
  })

  it.each([
    ['an option that does not exist', { id: 'ui.theme', value: 'automatic' }],
    ['a string for a boolean', { id: 'datum.verticalDatum', value: 'false' }],
    ['a boolean for options', { id: 'charts.scrollZoomMode', value: true }],
    ['an unknown id', { id: 'ui.map.showCoordinate', value: true }],
    ['a missing id', { value: true }],
    ['an unknown property', { id: 'ui.theme', label: 'Theme' }],
    ['a non-boolean enabled', { id: 'ui.theme', enabled: 'yes' }],
    ['a non-boolean favorite', { id: 'ui.theme', favorite: 1 }],
  ])('rejects %s', (_, entry) => {
    expect(isValid([entry])).toBe(false)
  })

  it('rejects unknown top-level properties and a missing settings array', () => {
    expect(
      Value.Check(DefaultUserSettingsSchema, { settings: [], extra: 1 }),
    ).toBe(false)
    expect(Value.Check(DefaultUserSettingsSchema, {})).toBe(false)
  })

  it('matches the compiled schemas/default-user-settings.schema.json', () => {
    // Run `npm run compile-schemas` when this fails.
    const compiled = JSON.parse(
      readFileSync('schemas/default-user-settings.schema.json', 'utf8'),
    )
    expect(compiled).toEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      ...JSON.parse(JSON.stringify(DefaultUserSettingsSchema)),
    })
  })
})
