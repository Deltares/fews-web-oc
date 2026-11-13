// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, shallowRef } from 'vue'
import type { FeatureCollection, Point } from 'geojson'
import { useSource } from '@/services/useLayer'

const source = vi.hoisted(() => ({
  setData: vi.fn(),
  updateData: vi.fn(),
}))
const map = vi.hoisted(() => ({
  addSource: vi.fn(),
  getSource: vi.fn(),
  removeSource: vi.fn(),
  getStyle: () => ({ layers: [] }),
}))

vi.mock('@/services/useMap', () => ({ useMap: () => ({ map }) }))
vi.mock('@/services/useLayerOrder', () => ({
  useLayerOrder: () => ({ getBeforeId: vi.fn() }),
}))
vi.mock('@indoorequal/vue-maplibre-gl', async () => {
  const { ref } = await import('vue')
  const isLoaded = ref(true)
  return { isLoadedSymbol: Symbol('isLoaded'), mapSymbol: isLoaded }
})
vi.mock('vue', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue')>()),
  inject: () => ref(true),
}))

const geometry: Point = { type: 'Point', coordinates: [4, 52] }

function collection(icon: string, point = geometry): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: point,
        properties: { locationId: 'a', icon },
      },
    ],
  }
}

function setup(promoteId: string | undefined = 'locationId') {
  const data = shallowRef(collection('first'))
  effectScope().run(() => {
    useSource('source', () => ({
      type: 'geojson',
      data: data.value,
      promoteId,
    }))
  })
  map.getSource.mockReturnValue(source)
  return data
}

describe('useSource with GeoJSON data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    map.getSource.mockReturnValue(undefined)
  })

  it('sends only changed properties if the geometry stays the same', async () => {
    const data = setup()

    data.value = collection('second')
    await nextTick()

    expect(source.setData).not.toHaveBeenCalled()
    expect(source.updateData).toHaveBeenCalledExactlyOnceWith({
      update: [
        {
          id: 'a',
          addOrUpdateProperties: [{ key: 'icon', value: 'second' }],
          removeProperties: [],
        },
      ],
    })
  })

  it('does not send anything if nothing changed', async () => {
    const data = setup()

    data.value = collection('first')
    await nextTick()

    expect(source.setData).not.toHaveBeenCalled()
    expect(source.updateData).not.toHaveBeenCalled()
  })

  it('compares against the last data after several updates', async () => {
    const data = setup()

    data.value = collection('second')
    await nextTick()
    data.value = collection('first')
    await nextTick()

    expect(source.updateData).toHaveBeenCalledTimes(2)
    expect(source.updateData.mock.lastCall?.[0].update[0]).toMatchObject({
      addOrUpdateProperties: [{ key: 'icon', value: 'first' }],
    })
  })

  it('sends all data if the geometry changed', async () => {
    const data = setup()
    const next = collection('first', { type: 'Point', coordinates: [5, 52] })

    data.value = next
    await nextTick()

    expect(source.updateData).not.toHaveBeenCalled()
    expect(source.setData).toHaveBeenCalledExactlyOnceWith(next)
  })

  it('sends all data for sources without a promoted id', async () => {
    const data = shallowRef(collection('first'))
    effectScope().run(() => {
      useSource('source', () => ({ type: 'geojson', data: data.value }))
    })
    map.getSource.mockReturnValue(source)
    const next = collection('second')

    data.value = next
    await nextTick()

    expect(source.updateData).not.toHaveBeenCalled()
    expect(source.setData).toHaveBeenCalledExactlyOnceWith(next)
  })
})
