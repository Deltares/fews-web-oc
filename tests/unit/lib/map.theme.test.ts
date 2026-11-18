import { describe, expect, it } from 'vitest'
import type { Map } from 'maplibre-gl'
import { isDarkColor, isMapStyleDark } from '@/lib/map/theme'

describe('isDarkColor', () => {
  it('classifies plain colors', () => {
    expect(isDarkColor('#0e0e0e')).toBe(true)
    expect(isDarkColor('#fafaf8')).toBe(false)
    expect(isDarkColor('rgb(20, 30, 40)')).toBe(true)
    expect(isDarkColor('hsl(0, 0%, 90%)')).toBe(false)
    expect(isDarkColor('white')).toBe(false)
  })

  it('uses the first color of legacy stops', () => {
    expect(
      isDarkColor({
        stops: [
          [0, '#111111'],
          [10, '#eeeeee'],
        ],
      }),
    ).toBe(true)
  })

  it('uses the first color of an expression', () => {
    expect(
      isDarkColor([
        'interpolate',
        ['linear'],
        ['zoom'],
        0,
        '#f0f0f0',
        10,
        '#101010',
      ]),
    ).toBe(false)
  })

  it('returns undefined if no color is found', () => {
    expect(isDarkColor(undefined)).toBeUndefined()
    expect(isDarkColor('not-a-color')).toBeUndefined()
    expect(isDarkColor(['get', 'color'])).toBeUndefined()
  })
})

interface TestLayer {
  id: string
  type: string
  visibility?: string
  color?: unknown
}

function createMap(layers: TestLayer[]): Map {
  const find = (id: string) => layers.find((layer) => layer.id === id)
  return {
    getLayersOrder: () => layers.map((layer) => layer.id),
    getLayer: (id: string) => find(id),
    getLayoutProperty: (id: string) => find(id)?.visibility,
    getPaintProperty: (id: string) => find(id)?.color,
  } as unknown as Map
}

describe('isMapStyleDark', () => {
  it('uses the first visible background layer', () => {
    const map = createMap([
      { id: 'hidden', type: 'background', visibility: 'none', color: '#fff' },
      { id: 'background', type: 'background', color: '#000' },
      { id: 'water', type: 'fill' },
    ])
    expect(isMapStyleDark(map)).toBe(true)
  })

  it('returns undefined without a background layer', () => {
    const map = createMap([{ id: 'osm', type: 'raster' }])
    expect(isMapStyleDark(map)).toBeUndefined()
  })
})
