// @vitest-environment jsdom
import type { WebOcGeneralConfig } from '@deltares/fews-pi-requests'
import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { usePageMetadata } from './index'

vi.mock('@/lib/fews-config', () => ({
  getResourcesStaticUrl: (resource: string) =>
    `https://example.test/resources/static/${resource}`,
}))

describe('usePageMetadata', () => {
  let scope: EffectScope

  beforeEach(() => {
    scope = effectScope()
    document.title = 'Delft-FEWS WebOC'
    document.head.insertAdjacentHTML(
      'beforeend',
      '<link rel="icon" href="/images/favicon.ico">',
    )
  })

  afterEach(() => {
    scope.stop()
    document.querySelector("link[rel='icon']")?.remove()
  })

  it('applies metadata that was loaded before the watchers start', () => {
    scope.run(() =>
      usePageMetadata({
        title: 'Configured title',
        icons: { favicon: 'configured.svg' },
      }),
    )

    expect(document.title).toBe('Configured title')
    expect(
      document.querySelector("link[rel='icon']")?.getAttribute('href'),
    ).toBe('https://example.test/resources/static/configured.svg')
  })

  it('keeps the HTML defaults when metadata is not configured', () => {
    scope.run(() => usePageMetadata({}))

    expect(document.title).toBe('Delft-FEWS WebOC')
    expect(
      document.querySelector("link[rel='icon']")?.getAttribute('href'),
    ).toBe('/images/favicon.ico')
  })

  it('updates metadata when configuration arrives or changes', async () => {
    const general = ref<WebOcGeneralConfig>({})
    scope.run(() => usePageMetadata(general))

    general.value = { title: 'First', icons: { favicon: 'first.svg' } }
    await nextTick()
    expect(document.title).toBe('First')
    expect(
      document.querySelector("link[rel='icon']")?.getAttribute('href'),
    ).toBe('https://example.test/resources/static/first.svg')

    general.value = { title: 'Second', icons: { favicon: 'second.svg' } }
    await nextTick()
    expect(document.title).toBe('Second')
    expect(
      document.querySelector("link[rel='icon']")?.getAttribute('href'),
    ).toBe('https://example.test/resources/static/second.svg')

    general.value = {}
    await nextTick()
    expect(document.title).toBe('Delft-FEWS Web OC')
    expect(
      document.querySelector("link[rel='icon']")?.getAttribute('href'),
    ).toBe('https://example.test/resources/static/second.svg')
  })
})
