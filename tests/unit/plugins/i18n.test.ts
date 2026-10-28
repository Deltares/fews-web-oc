import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  i18n,
  loadWebResourcesTranslations,
  resolveLocaleSetting,
} from '@/plugins/i18n'

vi.mock('@/lib/fews-config', () => ({
  getResourcesStaticUrl: (resource: string) => resource,
}))

describe('resolveLocaleSetting', () => {
  it('uses the application locale for default', () => {
    expect(resolveLocaleSetting('default', 'de', ['en-US'])).toBe('de')
  })

  it.each([
    ['en', 'en-GB'],
    ['de', 'de'],
  ])('maps language code %s to locale %s', (setting, locale) => {
    expect(resolveLocaleSetting(setting, 'de', [])).toBe(locale)
  })

  it('uses the first supported OS/browser language for system', () => {
    expect(resolveLocaleSetting('system', 'en-GB', ['fr-FR', 'de-AT'])).toBe(
      'de',
    )
    expect(resolveLocaleSetting('system', 'de', ['EN-us'])).toBe('en-GB')
  })

  it('falls back to the application locale for system without a supported language', () => {
    expect(resolveLocaleSetting('system', 'de', ['fr-FR', 'nl'])).toBe('de')
  })

  it('falls back to the application locale for an unknown value', () => {
    expect(resolveLocaleSetting('fr', 'en-GB', [])).toBe('en-GB')
  })
})

describe('loadWebResourcesTranslations', () => {
  const builtIn = {
    userSettings: {
      settings: 'Einstellungen',
      groups: { UI: 'Oberfläche', Map: 'Karte' },
    },
  }

  function mockResponse(
    body: unknown,
    { ok = true, contentType = 'application/json' } = {},
  ) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok,
      headers: new Headers({ 'Content-Type': contentType }),
      json: async () => {
        if (body instanceof Error) throw body
        return body
      },
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  beforeEach(() => {
    i18n.global.setLocaleMessage('de', structuredClone(builtIn))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('deep-merges the override over the built-in messages', async () => {
    mockResponse({ userSettings: { groups: { UI: 'Benutzeroberfläche' } } })

    await loadWebResourcesTranslations('de')

    expect(i18n.global.getLocaleMessage('de')).toEqual({
      userSettings: {
        settings: 'Einstellungen',
        groups: { UI: 'Benutzeroberfläche', Map: 'Karte' },
      },
    })
  })

  it('requests the file for the language code without caching', async () => {
    const fetchMock = mockResponse({})

    await loadWebResourcesTranslations('en-GB')

    expect(fetchMock).toHaveBeenCalledWith('locales/en.json', {
      cache: 'no-cache',
    })
  })

  it.each([
    ['a missing file', { ok: false }],
    ['an HTML page', { contentType: 'text/html' }],
  ])('silently ignores %s', async (_, options) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockResponse({ userSettings: { settings: 'X' } }, options)

    await loadWebResourcesTranslations('de')

    expect(i18n.global.getLocaleMessage('de')).toEqual(builtIn)
    expect(warn).not.toHaveBeenCalled()
  })

  it.each([
    ['invalid JSON', new SyntaxError('Unexpected token')],
    ['an array', [{ userSettings: {} }]],
    ['a string', 'Einstellungen'],
  ])('warns and keeps the built-in messages for %s', async (_, body) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockResponse(body)

    await loadWebResourcesTranslations('de')

    expect(i18n.global.getLocaleMessage('de')).toEqual(builtIn)
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('locales/de.json')
  })

  it('warns when the request fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))

    await loadWebResourcesTranslations('de')

    expect(i18n.global.getLocaleMessage('de')).toEqual(builtIn)
    expect(warn).toHaveBeenCalledOnce()
  })
})
