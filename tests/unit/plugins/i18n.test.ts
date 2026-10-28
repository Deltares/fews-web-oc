import { describe, expect, it, vi } from 'vitest'
import { resolveLocaleSetting } from '@/plugins/i18n'

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
