// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, ref, Suspense, type App } from 'vue'
import { isLoadedSymbol } from '@indoorequal/vue-maplibre-gl'
import ExternalOverlayLayer from '@/components/wms/ExternalOverlayLayer.vue'
import type { Overlay } from '@/services/useOverlays'

const map = vi.hoisted(() => {
  const layers: string[] = []
  const sources = new Set<string>()
  return {
    layers,
    sources,
    style: {},
    addLayer: vi.fn((layer: { id: string }) => layers.push(layer.id)),
    removeLayer: vi.fn((id: string) => layers.splice(layers.indexOf(id), 1)),
    getLayer: vi.fn((id: string) => (layers.includes(id) ? {} : undefined)),
    getLayersOrder: () => [...layers],
    addSource: vi.fn((id: string) => sources.add(id)),
    removeSource: vi.fn((id: string) => sources.delete(id)),
    getSource: vi.fn((id: string) => (sources.has(id) ? {} : undefined)),
    setPaintProperty: vi.fn(),
  }
})

vi.mock('@indoorequal/vue-maplibre-gl', () => ({
  isLoadedSymbol: Symbol('isLoaded'),
}))
vi.mock('@/services/useMap', () => ({ useMap: () => ({ map }) }))
vi.mock('@/services/useLayerOrder', () => ({
  useLayerOrder: () => ({ getBeforeId: () => undefined }),
}))
vi.mock('@/lib/fews-config', () => ({
  getResourcesStaticUrl: (resource: string) =>
    `https://fews.test/resources/static/${resource}`,
}))
vi.mock('@/lib/requests/transformRequest', () => ({
  createTransformRequestFn: () => async (request: Request) => request,
}))

const style = {
  version: 8,
  sources: { contours: { type: 'raster', tiles: ['https://wms.test/{z}'] } },
  layers: [
    {
      id: 'contours',
      type: 'raster',
      source: 'contours',
      paint: { 'raster-opacity': 0.5 },
    },
  ],
}

let app: App | undefined

async function flush() {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r))
}

async function mount(overlay: Overlay) {
  app = createApp({
    setup: () => () =>
      h(Suspense, null, {
        default: () => h(ExternalOverlayLayer, { overlay }),
      }),
  })
  app.provide(isLoadedSymbol, ref(true))
  app.mount(document.createElement('div'))
  await flush()
}

beforeEach(() => {
  vi.clearAllMocks()
  map.layers.length = 0
  map.sources.clear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(style))),
  )
})

afterEach(() => {
  app?.unmount()
  app = undefined
  vi.unstubAllGlobals()
})

const overlay: Overlay = {
  type: 'externalOverLay',
  id: 'srtm',
  styleJsonFile: 'maplayers/srtm/style.json',
  visible: true,
  opacity: 0.5,
}

describe('ExternalOverlayLayer', () => {
  it('adds its layers when mounted on an already loaded map', async () => {
    await mount(overlay)

    expect(map.layers).toEqual(['weboc-layer-overlay-srtm::contours'])
    expect(map.addLayer.mock.calls[0][0]).toMatchObject({
      source: 'weboc-source-overlay-srtm::contours',
    })
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      'weboc-layer-overlay-srtm::contours',
      'raster-opacity',
      0.25,
    )
  })

  it('removes its layers and sources when unmounted', async () => {
    await mount(overlay)
    app?.unmount()
    app = undefined

    expect(map.layers).toEqual([])
    expect(map.sources.size).toBe(0)
  })

  it('does not add layers when the style cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 })),
    )
    await mount(overlay)

    expect(map.addLayer).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalled()
  })
})
