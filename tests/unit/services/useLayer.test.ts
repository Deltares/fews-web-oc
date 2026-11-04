// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref, type App } from 'vue'
import type { AddLayerObject } from 'maplibre-gl'
import { isLoadedSymbol } from '@indoorequal/vue-maplibre-gl'
import { useLayer } from '@/services/useLayer'

const map = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  getLayer: vi.fn(),
  getLayersOrder: () => [],
  setFilter: vi.fn(),
  style: { _loaded: true },
}))

vi.mock('@indoorequal/vue-maplibre-gl', () => ({
  isLoadedSymbol: Symbol('isLoaded'),
}))
vi.mock('@/services/useMap', () => ({ useMap: () => ({ map }) }))
vi.mock('@/services/useLayerOrder', () => ({
  useLayerOrder: () => ({ getBeforeId: () => undefined }),
}))

let app: App | undefined

function mountLayer() {
  const locationId = ref('a')
  app = createApp({
    setup() {
      useLayer(
        'layer',
        () =>
          ({
            id: 'layer',
            type: 'fill',
            source: 'source',
            filter: ['==', 'locationId', locationId.value],
          }) as AddLayerObject,
      )
      return () => h('div')
    },
  })
  app.provide(isLoadedSymbol, ref(true))
  app.mount(document.createElement('div'))
  return locationId
}

function styleLoadHandler() {
  return map.on.mock.calls.find(([event]) => event === 'style.load')?.[1]
}

beforeEach(() => {
  vi.clearAllMocks()
  map.style._loaded = true
  map.getLayer.mockReturnValue({})
})

afterEach(() => {
  app?.unmount()
  app = undefined
})

describe('useLayer filter', () => {
  it('updates the filter when the style is loaded', async () => {
    const locationId = mountLayer()

    locationId.value = 'b'
    await nextTick()

    expect(map.setFilter).toHaveBeenCalledWith('layer', [
      '==',
      'locationId',
      'b',
    ])
  })

  it('does not set a filter on a layer that has not been added', async () => {
    map.getLayer.mockReturnValue(undefined)
    const locationId = mountLayer()

    locationId.value = 'b'
    await nextTick()

    expect(map.setFilter).not.toHaveBeenCalled()
  })

  it('applies a filter change made during a rebuild once the style has loaded', async () => {
    const locationId = mountLayer()
    map.style._loaded = false

    locationId.value = 'b'
    await nextTick()
    expect(map.setFilter).not.toHaveBeenCalled()

    map.style._loaded = true
    styleLoadHandler()()

    expect(map.setFilter).toHaveBeenCalledWith('layer', [
      '==',
      'locationId',
      'b',
    ])
  })

  it('removes the style.load listener on dispose', () => {
    mountLayer()
    const handler = styleLoadHandler()

    app?.unmount()
    app = undefined

    expect(map.off).toHaveBeenCalledWith('style.load', handler)
  })
})
