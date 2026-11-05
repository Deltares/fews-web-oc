// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computed,
  createApp,
  h,
  nextTick,
  reactive,
  shallowRef,
  toValue,
  type App,
  type MaybeRefOrGetter,
} from 'vue'
import type {
  AddLayerObject,
  GeoJSONSourceSpecification,
  SourceSpecification,
} from 'maplibre-gl'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Location } from '@deltares/fews-pi-requests'
import LocationsLayer from '@/components/wms/LocationsLayer.vue'
import { defaultMapSettings } from '@/lib/topology/componentSettings'
import { mapIds } from '@/lib/map'
import { getLocationCategory, isNonPointGeometry } from '@/lib/map/locations'

const map = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  setFeatureState: vi.fn(),
  removeFeatureState: vi.fn(),
  getSource: vi.fn(),
  getCanvas: () => ({ style: { cursor: '' } }),
  style: { _loaded: true },
}))

vi.mock('@/services/useMap', () => ({ useMap: () => ({ map }) }))
vi.mock('@/services/useMapIsDark', () => ({
  useMapIsDark: () => false,
}))
vi.mock('@/stores/userSettings', () => ({
  useUserSettingsStore: () => ({ get: () => undefined }),
}))
vi.mock('@/lib/location-icons', () => ({
  addLocationIconsToMap: vi.fn(async () => {}),
}))
vi.mock('@indoorequal/vue-maplibre-gl', () => ({
  MglMarker: {
    props: ['coordinates', 'offset', 'anchor'],
    template: '<div class="marker" />',
  },
}))
vi.mock('vuetify/lib/components/VIcon/index.js', () => ({
  VIcon: { template: '<span />' },
}))

const source = shallowRef({ type: 'geojson' })
const layers = new Map<string, () => AddLayerObject>()
let sourceOptions: () => SourceSpecification | undefined

vi.mock('@/services/useLayer', () => ({
  useSource: (
    _id: string,
    options: MaybeRefOrGetter<SourceSpecification | undefined>,
  ) => {
    const value = computed(() => toValue(options))
    sourceOptions = () => value.value
    return { source }
  },
  useLayer: (id: string, options: MaybeRefOrGetter<AddLayerObject>) => {
    const value = computed(() => toValue(options))
    layers.set(id, () => value.value)
  },
}))

const geojson: FeatureCollection<Geometry, Location> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        locationId: 'child',
        locationName: 'Child location',
        parentLocationId: 'parent',
        iconName: 'station',
      },
      geometry: { type: 'Point', coordinates: [4, 52] },
    },
    {
      type: 'Feature',
      properties: { locationId: 'district', locationName: 'District' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [4, 52],
            [5, 52],
            [5, 53],
            [4, 52],
          ],
        ],
      },
    },
  ],
}

let app: App | undefined
let container: HTMLDivElement

function mountLayer() {
  const props = reactive({
    locationsGeoJson: geojson,
    selectedLocationIds: ['child'],
    settings: { ...defaultMapSettings.locationsLayer, singleClickAction: true },
    showLocations: true,
  })
  app = createApp({ render: () => h(LocationsLayer, props) })
  app.component('v-icon', { template: '<span />' })
  app.mount(container)
  return props
}

function styleLoad() {
  for (const [event, handler] of map.on.mock.calls) {
    if (event === 'style.load') handler()
  }
}

function fillEvent(name: string, locationId?: string) {
  const handlers = map.on.mock.calls.filter(
    ([event, layer]) => event === name && layer === mapIds.location.layer.fill,
  )
  expect(handlers.length).toBeGreaterThan(0)
  for (const [, , handler] of handlers) {
    handler({
      features:
        locationId === undefined ? [] : [{ properties: { locationId } }],
    })
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  layers.clear()
  source.value = { type: 'geojson' }
  map.style._loaded = true
  map.getSource.mockImplementation(() => source.value)
  container = document.createElement('div')
})

afterEach(() => {
  app?.unmount()
  app = undefined
})

describe('location map interactions', () => {
  it('updates selection without rebuilding the source, preserving markers and symbol filters', async () => {
    const props = mountLayer()
    const originalOptions = sourceOptions() as GeoJSONSourceSpecification
    expect(originalOptions.promoteId).toBe('locationId')
    expect(container.querySelectorAll('.marker')).toHaveLength(1)
    const originalFilter = getFilter(mapIds.location.layer.symbol)
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: mapIds.location.source, id: 'child' },
      { selected: true },
    )

    props.selectedLocationIds = ['district']
    await nextTick()

    expect(sourceOptions()).toBe(originalOptions)
    expect(container.querySelectorAll('.marker')).toHaveLength(0)
    const updatedFilter = getFilter(mapIds.location.layer.symbol)
    expect(updatedFilter).not.toEqual(originalFilter)
    expect(JSON.stringify(updatedFilter)).not.toContain('"child"')
    expect(map.removeFeatureState).toHaveBeenCalledWith(
      { source: mapIds.location.source, id: 'child' },
      'selected',
    )
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: mapIds.location.source, id: 'district' },
      { selected: true },
    )

    props.selectedLocationIds = []
    await nextTick()
    expect(getFilter(mapIds.location.layer.symbol)).toBe(updatedFilter)
    expect(sourceOptions()).toBe(originalOptions)

    props.selectedLocationIds.push('child')
    await nextTick()
    expect(container.querySelectorAll('.marker')).toHaveLength(1)
    expect(
      JSON.stringify(getFilter(mapIds.location.layer.childSymbol)),
    ).toContain('"child"')
    expect(sourceOptions()).toBe(originalOptions)
  })

  it('updates hover state without changing the source or paint, and clears it on leave', async () => {
    mountLayer()
    const options = sourceOptions()
    const paint = getPaint(mapIds.location.layer.fill)
    map.setFeatureState.mockClear()

    fillEvent('mousemove', 'district')
    await nextTick()
    expect(map.setFeatureState).toHaveBeenCalledExactlyOnceWith(
      { source: mapIds.location.source, id: 'district' },
      { hover: true },
    )
    expect(sourceOptions()).toBe(options)
    expect(getPaint(mapIds.location.layer.fill)).toBe(paint)

    fillEvent('mousemove', 'district')
    await nextTick()
    expect(map.setFeatureState).toHaveBeenCalledTimes(1)

    fillEvent('mouseleave')
    await nextTick()
    expect(map.removeFeatureState).toHaveBeenCalledWith(
      { source: mapIds.location.source, id: 'district' },
      'hover',
    )
  })

  it('restores interaction state when the style is rebuilt with the same source ref', async () => {
    mountLayer()
    fillEvent('mousemove', 'district')
    await nextTick()
    map.setFeatureState.mockClear()

    styleLoad()

    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: mapIds.location.source, id: 'child' },
      { selected: true },
    )
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: mapIds.location.source, id: 'district' },
      { hover: true },
    )
  })

  it('restores interaction state when the source is recreated', async () => {
    mountLayer()
    map.setFeatureState.mockClear()

    source.value = { type: 'geojson' }
    await nextTick()

    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: mapIds.location.source, id: 'child' },
      { selected: true },
    )
  })

  it('does not touch feature state during a rebuild and applies the latest state afterwards', async () => {
    const props = mountLayer()
    map.setFeatureState.mockClear()
    map.removeFeatureState.mockClear()
    map.style._loaded = false
    const notLoaded = () => {
      throw new Error('Style is not done loading.')
    }
    map.setFeatureState.mockImplementation(notLoaded)
    map.removeFeatureState.mockImplementation(notLoaded)

    props.selectedLocationIds = ['district']
    await nextTick()
    fillEvent('mousemove', 'district')
    await nextTick()

    expect(map.setFeatureState).not.toHaveBeenCalled()
    expect(map.removeFeatureState).not.toHaveBeenCalled()

    map.style._loaded = true
    map.setFeatureState.mockReset()
    map.removeFeatureState.mockReset()
    styleLoad()

    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: mapIds.location.source, id: 'district' },
      { selected: true },
    )
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: mapIds.location.source, id: 'district' },
      { hover: true },
    )
    expect(map.setFeatureState).not.toHaveBeenCalledWith(
      { source: mapIds.location.source, id: 'child' },
      { selected: true },
    )
  })

  it('clears feature state on unmount after a rebuild replaced the source', async () => {
    mountLayer()
    styleLoad()
    map.getSource.mockImplementation(() => ({ type: 'geojson' }))
    map.removeFeatureState.mockClear()

    app?.unmount()
    app = undefined

    expect(map.removeFeatureState).toHaveBeenCalledWith(
      { source: mapIds.location.source, id: 'child' },
      'selected',
    )
  })

  it('removes the same fill handlers on setting changes and unmount', async () => {
    const props = mountLayer()
    const handlers = map.on.mock.calls.filter(
      ([event, layer]) =>
        (event === 'mousemove' || event === 'mouseleave') &&
        layer === mapIds.location.layer.fill,
    )
    props.settings.singleClickAction = false
    await nextTick()
    for (const args of handlers) {
      expect(map.off).toHaveBeenCalledWith(...args)
    }

    map.off.mockClear()
    app?.unmount()
    app = undefined
    for (const args of handlers) {
      expect(map.off).toHaveBeenCalledWith(...args)
    }
  })

  it('classifies multi-geometries as non-point locations', () => {
    const nonPointGeometries: Geometry[] = [
      { type: 'Polygon', coordinates: [] },
      { type: 'MultiPolygon', coordinates: [] },
      { type: 'LineString', coordinates: [] },
      { type: 'MultiLineString', coordinates: [] },
      { type: 'GeometryCollection', geometries: [] },
    ]

    expect(nonPointGeometries.map(isNonPointGeometry)).toEqual([
      true,
      true,
      true,
      true,
      true,
    ])
    expect(isNonPointGeometry({ type: 'Point', coordinates: [] })).toBe(false)
  })

  it('uses a thinner line width for non-point outlines', () => {
    mountLayer()

    expect(getPaint(mapIds.location.layer.line)).toMatchObject({
      'line-width': 0.5,
    })
  })

  it('groups categories by icon label and gives thresholds only to points', () => {
    const feature = (
      geometry: Geometry,
      properties: Partial<Location> = {},
    ) => ({
      type: 'Feature' as const,
      geometry,
      properties: { locationId: 'location', ...properties } as Location,
    })
    const polygon = feature(
      { type: 'MultiPolygon', coordinates: [] },
      { iconLabel: 'Warnings', thresholdIconName: 'high' },
    )
    const polygonWithDifferentThreshold = feature(
      { type: 'Polygon', coordinates: [] },
      { iconLabel: 'Warnings', thresholdIconName: 'low' },
    )
    const polygonWithDifferentLabel = feature(
      { type: 'Polygon', coordinates: [] },
      { iconLabel: 'Alerts' },
    )
    const point = feature(
      { type: 'Point', coordinates: [0, 0] },
      { iconLabel: 'Warnings', thresholdIconName: 'high' },
    )
    const pointWithDifferentThreshold = feature(
      { type: 'Point', coordinates: [1, 1] },
      { iconLabel: 'Warnings', thresholdIconName: 'low' },
    )
    const unlabeledPolygon = feature({ type: 'Polygon', coordinates: [] })
    const secondUnlabeledPolygon = feature({
      type: 'MultiPolygon',
      coordinates: [],
    })

    expect(getLocationCategory(polygon)).toBe(
      getLocationCategory(polygonWithDifferentThreshold),
    )
    expect(getLocationCategory(polygon)).not.toBe(
      getLocationCategory(polygonWithDifferentLabel),
    )
    expect(getLocationCategory(polygon)).not.toBe(getLocationCategory(point))
    expect(getLocationCategory(point)).toBe('Warnings-high')
    expect(getLocationCategory(point)).not.toBe(
      getLocationCategory(pointWithDifferentThreshold),
    )
    expect(getLocationCategory(unlabeledPolygon)).toBe(
      getLocationCategory(secondUnlabeledPolygon),
    )
  })

  function getFilter(id: string) {
    const layer = layers.get(id)!()
    return 'filter' in layer ? layer.filter : undefined
  }

  function getPaint(id: string) {
    const layer = layers.get(id)!()
    return 'paint' in layer ? layer.paint : undefined
  }
})
