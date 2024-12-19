import { LngLat } from 'maplibre-gl'

export function coordinateToString(coordinate: LngLat | null) {
  return coordinate
    ? `${coordinate.lat.toFixed(2)}°N ${coordinate.lng.toFixed(2)}°E`
    : '—'
}

export function coordinateToStringParts(coordinate: LngLat | null) {
  return coordinate
    ? [`${coordinate.lat.toFixed(2)}°N`, `${coordinate.lng.toFixed(2)}°E`]
    : ['—°N', '—°E']
}
