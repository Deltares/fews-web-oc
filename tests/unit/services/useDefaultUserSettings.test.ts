import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchWebResourcesDefaultUserSettings } from '@/services/useDefaultUserSettings'

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

  it('returns valid overrides when payload matches schema', async () => {
    const payload = {
      settings: [
        { id: 'ui.theme', value: 'dark', favorite: true },
        { id: 'charts.scrollZoomMode', enabled: false },
      ],
    }
    const schema = {
      type: 'object',
      properties: {
        settings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              value: { anyOf: [{ type: 'string' }, { type: 'boolean' }] },
              enabled: { type: 'boolean' },
              favorite: { type: 'boolean' },
            },
            required: ['id'],
            additionalProperties: false,
          },
        },
      },
      required: ['settings'],
      additionalProperties: false,
    }

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(mockResponse(true, payload))
        .mockResolvedValueOnce(mockResponse(true, schema)),
    )

    const result = await fetchWebResourcesDefaultUserSettings()

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('ui.theme')
    expect(result[0].favorite).toBe(true)
    expect(result[1].enabled).toBe(false)
  })

  it('returns empty array when schema validation fails', async () => {
    const payload = {
      settings: [{ id: 'ui.theme', value: 123 }],
    }
    const schema = {
      type: 'object',
      properties: {
        settings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['id', 'value'],
            additionalProperties: false,
          },
        },
      },
      required: ['settings'],
      additionalProperties: false,
    }

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(mockResponse(true, payload))
        .mockResolvedValueOnce(mockResponse(true, schema)),
    )

    const result = await fetchWebResourcesDefaultUserSettings()

    expect(result).toHaveLength(0)
  })

  it('falls back to structural validation when schema is unavailable', async () => {
    const payload = {
      settings: [{ id: 'ui.theme', value: 'dark', favorite: true }],
    }

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(mockResponse(true, payload))
        .mockResolvedValueOnce(mockResponse(false, {})),
    )

    const result = await fetchWebResourcesDefaultUserSettings()

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('ui.theme')
  })

  it('returns empty array when payload shape is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(mockResponse(true, { unsupported: true }))
        .mockResolvedValueOnce(mockResponse(false, {})),
    )

    const result = await fetchWebResourcesDefaultUserSettings()

    expect(result).toHaveLength(0)
  })
})
