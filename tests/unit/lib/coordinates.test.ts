import { describe, expect, it } from 'vitest'
import { LngLat } from 'maplibre-gl'
import { roundCoordinateToString } from '@/lib/coordinates'
import {
  coordinateToString,
  coordinateToStringParts,
} from '@/lib/workflows/coordinates'

describe('roundCoordinateToString', () => {
  it.each([
    [12.345674, '12.34567'],
    [-29.123456, '-29.12346'],
    [32.08, '32.08000'],
    [0, '0.00000'],
  ])('rounds %s to five decimal places', (coordinate, expected) => {
    expect(roundCoordinateToString(coordinate)).toBe(expected)
  })
})

describe('workflow coordinate formatting', () => {
  it('preserves five decimal places for both coordinates', () => {
    const coordinate = new LngLat(32.08, -29.123456)
    expect(coordinateToString(coordinate)).toBe('-29.12346°N 32.08000°E')
    expect(coordinateToStringParts(coordinate)).toEqual([
      '-29.12346°N',
      '32.08000°E',
    ])
  })

  it('preserves placeholders for missing coordinates', () => {
    expect(coordinateToString(null)).toBe('—')
    expect(coordinateToStringParts(null)).toEqual(['—°N', '—°E'])
  })
})
