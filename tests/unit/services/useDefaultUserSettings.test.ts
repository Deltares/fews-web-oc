import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchWebResourcesDefaultUserSettings,
  validateDefaultUserSettings,
} from '../../../src/services/useDefaultUserSettings'

vi.mock('@/lib/fews-config', () => ({
  getResourcesStaticUrl: (resource: string) =>
    `http://example.test/${resource}`,
}))

interface MockResponse {
  ok: boolean
  json: () => Promise<unknown>
}

function mockResponse(ok: boolean, body: unknown): MockResponse {
  return {
    ok,
    json: async () => body,
  }
}

describe('fetchWebResourcesDefaultUserSettings', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns valid overrides when payload shape is valid', async () => {
    const payload = {
      settings: [
        { id: 'ui.theme', value: 'dark', favorite: true },
        { id: 'charts.scrollZoomMode', value: 'xy', enabled: false },
      ],
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(mockResponse(true, payload)),
    )

    const result = await fetchWebResourcesDefaultUserSettings()

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('ui.theme')
    expect(result[0].favorite).toBe(true)
    expect(result[1].enabled).toBe(false)
  })

  it('filters structurally invalid override entries', async () => {
    const payload = {
      settings: [
        { id: 'ui.theme', value: 'dark' },
        { id: 'ui.theme', enabled: 'bad-type' },
      ],
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(mockResponse(true, payload)),
    )

    const result = await fetchWebResourcesDefaultUserSettings()

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('ui.theme')
  })

  it('accepts array payload shape directly', async () => {
    const payload = [
      { id: 'ui.theme', value: 'dark', favorite: true },
      { id: 'charts.scrollZoomMode', value: 'xy', enabled: false },
    ]

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(mockResponse(true, payload)),
    )

    const result = await fetchWebResourcesDefaultUserSettings()

    expect(result).toHaveLength(2)
  })

  it('returns empty array when fetch is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(mockResponse(false, {})),
    )

    const result = await fetchWebResourcesDefaultUserSettings()

    expect(result).toHaveLength(0)
  })

  it('returns empty array when payload shape is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(mockResponse(true, { unsupported: true })),
    )

    const result = await fetchWebResourcesDefaultUserSettings()

    expect(result).toHaveLength(0)
  })

  it('returns empty array when all entries are structurally invalid', async () => {
    const payload = {
      settings: [
        { value: 'missing-id' },
        { id: 'ui.theme', enabled: 'bad-type' },
      ],
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(mockResponse(true, payload)),
    )

    const result = await fetchWebResourcesDefaultUserSettings()

    expect(result).toHaveLength(0)
  })
})

describe('validateDefaultUserSettings', () => {
  it('accepts an object with settings and a bare array', () => {
    const settings = [{ id: 'ui.theme', value: 'dark' }]

    expect(validateDefaultUserSettings({ settings })).toEqual({
      overrides: settings,
      errors: [],
    })
    expect(validateDefaultUserSettings(settings).overrides).toEqual(settings)
  })

  it('keeps valid entries and describes each invalid one', () => {
    const { overrides, errors } = validateDefaultUserSettings({
      $schema: './default-user-settings.schema.json',
      settings: [
        { id: 'ui.theme', value: 'automatic' },
        { id: 'datum.verticalDatum', value: 'false', favorite: 1 },
        { id: 'ui.map.showCoordinate', value: true },
        { value: true },
        { id: 'ui.theme', label: 'Theme' },
        { id: 'charts.brush', enabled: false },
      ],
    })

    expect(overrides).toEqual([{ id: 'charts.brush', enabled: false }])
    expect(errors).toEqual([
      'settings[0] (ui.theme): "value" must be one of "auto", "light", "dark", got "automatic"',
      'settings[1] (datum.verticalDatum): "value" must be true or false, got "false"; "favorite" must be true or false, got 1',
      'settings[2]: unknown setting id "ui.map.showCoordinate"',
      'settings[3]: "id" is missing',
      'settings[4] (ui.theme): unknown property "label"',
    ])
  })

  it('accepts configured time zones', () => {
    const settings = [
      {
        id: 'ui.timeZone',
        value: 'Europe/Amsterdam',
        items: [{ value: 'UTC' }, { value: 'Europe/Amsterdam' }],
      },
    ]

    expect(validateDefaultUserSettings({ settings })).toEqual({
      overrides: settings,
      errors: [],
    })
  })

  it('leaves out unknown time zones', () => {
    const { overrides, errors } = validateDefaultUserSettings({
      settings: [
        {
          id: 'ui.timeZone',
          value: 'Mars/Olympus_Mons',
          items: [{ value: 'system' }, { value: 'Europe/Amsterdm' }],
        },
        { id: 'ui.timeZone', items: [{ value: 'CEST' }] },
      ],
    })

    expect(overrides).toEqual([
      { id: 'ui.timeZone', items: [{ value: 'system' }] },
      { id: 'ui.timeZone' },
    ])
    expect(errors).toEqual([
      'settings[0] (ui.timeZone): unknown time zone "Europe/Amsterdm" ignored',
      'settings[0] (ui.timeZone): unknown time zone "Mars/Olympus_Mons" ignored',
      'settings[1] (ui.timeZone): unknown time zone "CEST" ignored',
    ])
  })

  it('reports unknown top-level properties but still uses the settings', () => {
    const { overrides, errors } = validateDefaultUserSettings({
      settings: [{ id: 'ui.theme', value: 'dark' }],
      default: true,
    })

    expect(overrides).toHaveLength(1)
    expect(errors).toEqual(['unknown property "default" ignored'])
  })

  it('rejects a payload without settings', () => {
    expect(validateDefaultUserSettings({ unsupported: true })).toEqual({
      overrides: [],
      errors: ['expected an array or an object with a "settings" array'],
    })
  })
})
