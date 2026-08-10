import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchWebResourcesDefaultUserSettings } from '../../../src/services/useDefaultUserSettings'

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
        { id: 'charts.scrollZoomMode', value: true, enabled: false },
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
      { id: 'charts.scrollZoomMode', value: true, enabled: false },
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
