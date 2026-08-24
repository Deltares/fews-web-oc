import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadApplicationConfig } from './config-loader.js'

function mockFetchResponse(
  body: string,
  init: { status?: number; contentType?: string | null } = {},
) {
  const { status = 200, contentType = 'application/json' } = init
  const headers = new Headers()
  if (contentType !== null) headers.set('Content-Type', contentType)

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Not Found',
      headers,
      text: () => Promise.resolve(body),
    }),
  )
}

const config =
  '{"VITE_FEWS_WEBSERVICES_URL":"https://example.org/FewsWebServices/"}'

describe('loadApplicationConfig', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses a config served with an application/json content type', async () => {
    mockFetchResponse(config)

    await expect(loadApplicationConfig()).resolves.toEqual({
      VITE_FEWS_WEBSERVICES_URL: 'https://example.org/FewsWebServices/',
    })
  })

  it('parses a config served without a content type', async () => {
    // Android WebView asset servers do not set a content type for .json, so a
    // missing header must not fail the startup sequence.
    mockFetchResponse(config, { contentType: null })

    await expect(loadApplicationConfig()).resolves.toEqual({
      VITE_FEWS_WEBSERVICES_URL: 'https://example.org/FewsWebServices/',
    })
  })

  it('accepts a content type with a charset parameter', async () => {
    mockFetchResponse(config, {
      contentType: 'application/json; charset=utf-8',
    })

    await expect(loadApplicationConfig()).resolves.toHaveProperty(
      'VITE_FEWS_WEBSERVICES_URL',
    )
  })

  it('rejects an SPA fallback served as text/html', async () => {
    mockFetchResponse('<!doctype html><html></html>', {
      contentType: 'text/html',
    })

    await expect(loadApplicationConfig()).rejects.toThrow(
      /Invalid content type for app-config\.json/,
    )
  })

  it('rejects a non-200 response', async () => {
    mockFetchResponse('', { status: 404 })

    await expect(loadApplicationConfig()).rejects.toThrow(
      /Failed to load app-config\.json \(404 Not Found\)/,
    )
  })

  it('rejects malformed JSON', async () => {
    mockFetchResponse('{ not json', { contentType: null })

    await expect(loadApplicationConfig()).rejects.toThrow(
      /Invalid JSON in app-config\.json/,
    )
  })
})
