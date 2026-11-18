// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, type App } from 'vue'
import { provideLayerOrder, useLayerOrder } from '@/services/useLayerOrder'
import type { Overlay } from '@/services/useOverlays'
import type { BaseMap } from '@/lib/basemap'
import { getLayerId, getSubLayerId, mapIds } from '@/lib/map'

let app: App | undefined

afterEach(() => {
  app?.unmount()
  app = undefined
})

function setup(overlays: Overlay[]) {
  let getBeforeId!: ReturnType<typeof useLayerOrder>['getBeforeId']
  const Child = {
    setup() {
      getBeforeId = useLayerOrder().getBeforeId
      return () => h('div')
    },
  }
  app = createApp({
    setup() {
      provideLayerOrder(overlays, {} as BaseMap)
      return () => h(Child)
    },
  })
  app.mount(document.createElement('div'))
  return getBeforeId
}

const external = getLayerId('overlay-ext')
const extA = getSubLayerId(external, 'a')
const extB = getSubLayerId(external, 'b')
const wms = getLayerId('overlay-wms')

describe('useLayerOrder with layer groups', () => {
  // Bottom to top: grid layer, external overlay, WMS overlay
  const overlays: Overlay[] = [
    { type: 'gridLayer', opacity: 1 },
    { type: 'externalOverLay', id: 'ext', opacity: 1 },
    { type: 'overLay', id: 'wms', opacity: 1 },
  ]

  it('places a layer below the bottom-most sub layer of the next group', () => {
    const getBeforeId = setup(overlays)
    expect(getBeforeId(mapIds.wms.layer, ['base', extA, extB, wms])).toBe(extA)
  })

  it('orders sub layers by their group', () => {
    const getBeforeId = setup(overlays)
    expect(getBeforeId(extA, ['base', mapIds.wms.layer, wms])).toBe(wms)
    expect(getBeforeId(external, ['base', mapIds.wms.layer, wms])).toBe(wms)
  })

  it('does not place a group before one of its own sub layers', () => {
    const getBeforeId = setup([
      { type: 'externalOverLay', id: 'ext', opacity: 1 },
    ])
    const other = getLayerId('other')
    expect(getBeforeId(extB, ['base', extA, other])).toBe(other)
  })
})
