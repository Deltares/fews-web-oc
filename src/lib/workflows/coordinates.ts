import { LngLat } from 'maplibre-gl'
import { roundCoordinateToString } from '@/lib/coordinates'

export function coordinateToString(coordinate: LngLat | null) {
  return coordinate
    ? `${roundCoordinateToString(coordinate.lat)}°N ${roundCoordinateToString(coordinate.lng)}°E`
    : '—'
}

export function coordinateToStringParts(coordinate: LngLat | null) {
  return coordinate
    ? [
        `${roundCoordinateToString(coordinate.lat)}°N`,
        `${roundCoordinateToString(coordinate.lng)}°E`,
      ]
    : ['—°N', '—°E']
}
