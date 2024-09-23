import { LngLat } from 'maplibre-gl'

export function coordinateToString(coordinate: LngLat | null) {
  return coordinate
    ? `${coordinate.lng.toFixed(2)}°E ${coordinate.lat.toFixed(2)}°N`
    : '—'
}
