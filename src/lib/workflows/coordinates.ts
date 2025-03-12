import { LngLat } from 'maplibre-gl'

export function coordinateToString(coordinate: LngLat | null) {
  return coordinate
    ? `${coordinate.lat.toFixed(5)}°N ${coordinate.lng.toFixed(5)}°E`
    : '—'
}

export function coordinateToStringParts(coordinate: LngLat | null) {
  return coordinate
    ? [`${coordinate.lat.toFixed(5)}°N`, `${coordinate.lng.toFixed(5)}°E`]
    : ['—°N', '—°E']
}
