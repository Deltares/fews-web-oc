import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isReactive } from 'vue'
import { useSearchContext } from './searchContext'

describe('Search context', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('indexes labels and IDs without changing display or route values', () => {
    const store = useSearchContext()
    store.setLocations([
      { locationId: 'BASIN', locationName: 'River Basin' },
      {
        locationId: 'Station-A',
        locationName: 'Water Level',
        parentLocationId: 'BASIN',
      },
    ])

    expect(isReactive(store.items)).toBe(false)
    expect(isReactive(store.items[0])).toBe(false)
    expect(isReactive(store.items[0].children)).toBe(false)
    expect(isReactive(store.items[0].children?.[0])).toBe(false)
    expect(store.items[0].children?.[0]).toMatchObject({
      id: 'Station-A',
      label: 'Water Level',
      normalizedId: 'station-a',
      normalizedLabel: 'water level',
      params: { locationId: 'Station-A' },
    })
  })

  it('indexes fallback labels and orphaned locations', () => {
    const store = useSearchContext()
    store.setLocations([
      { locationId: 'A', shortName: 'Short Name' },
      { locationId: 'B' },
      { locationId: 'C', locationName: '' },
      {
        locationId: 'Orphan',
        locationName: 'Orphan Name',
        parentLocationId: 'Missing',
      },
    ])

    expect(store.items.map((item) => item.normalizedLabel)).toEqual([
      'short name',
      'b',
      '',
      'orphan name',
    ])
  })

  it('refreshes the index when locations are replaced and retains routes', () => {
    const store = useSearchContext()
    store.setTopologyNodes(
      [{ id: 'Route', name: 'River Map', url: 'https://example.com' }],
      'Topology',
    )
    const topology = store.items[0]
    store.setLocations([{ locationId: 'Station', locationName: 'Old Name' }])
    store.search = 'old'
    expect(store.filteredItems).toHaveLength(1)

    store.setLocations([{ locationId: 'Station', locationName: 'New Name' }])
    expect(store.items[0]).toBe(topology)
    expect(topology).toMatchObject({
      normalizedLabel: 'river map',
      normalizedId: 'topology:topology:route',
    })
    expect(store.filteredItems).toEqual([])
    store.search = ' NEW '
    expect(store.filteredItems[0].label).toBe('New Name')

    const location = store.items[1]
    store.setTopologyNodes([], undefined)
    expect(store.items).toEqual([location])
    expect(store.items[0]).toBe(location)
    store.setLocations([])
    expect(store.filteredItems).toEqual([])
  })

  it('indexes nested routes while retaining their original paths', () => {
    const store = useSearchContext()
    store.setTopologyNodes(
      [
        {
          id: 'Parent',
          name: 'Routes',
          topologyNodes: [
            { id: 'Child', name: 'River Map', url: 'https://example.com' },
          ],
        },
      ],
      'Topology',
    )

    expect(store.items[0].children?.[0]).toMatchObject({
      id: 'topology:Topology:Child',
      label: 'River Map',
      normalizedLabel: 'river map',
      normalizedId: 'topology:topology:child',
      params: { topologyId: 'Topology', nodeId: ['Parent', 'Child'] },
    })
  })

  it('reuses normalized text when searching 20,000 locations', () => {
    const store = useSearchContext()
    store.setLocations(
      Array.from({ length: 20_000 }, (_, index) => ({
        locationId: `Station-${index}`,
        locationName: `Water Level ${index}`,
      })),
    )
    const items = store.items
    expect(items).toHaveLength(20_000)
    store.search = ' WATER LEVEL 19999 '

    const toLowerCase = vi.spyOn(String.prototype, 'toLowerCase')
    try {
      const matches = store.filteredItems
      const normalizationCount = toLowerCase.mock.calls.length
      expect(matches.map((item) => item.id)).toEqual(['Station-19999'])
      expect(normalizationCount).toBe(1)
    } finally {
      toLowerCase.mockRestore()
    }

    expect(store.items).toBe(items)
    store.search = 'station-19999'
    expect(store.filteredItems).toEqual([])
    store.search = '   '
    expect(store.filteredItems).toBe(items)
  })
})
